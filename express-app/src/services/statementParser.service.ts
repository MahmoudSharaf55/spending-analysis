import { execFileSync } from 'child_process';
import fs from 'fs';
import { parse as parseCsvSync } from 'csv-parse/sync';
import { PDFParse } from 'pdf-parse';
import {
  AccountType,
  RawExtractedTransaction,
  StatementAccountMeta
} from '../types/index.js';
import { AccountDetectorService } from './accountDetector.service.js';

export interface ParseResult {
  rawTransactions: RawExtractedTransaction[];
  accountsMeta: StatementAccountMeta[];
  statementPeriod: { start: string; end: string };
  currency: string;
}

export class StatementParserService {
  /**
   * Main entry point to parse a PDF or CSV file.
   */
  static async parseFile(filePath: string, originalName: string): Promise<ParseResult> {
    const isCsv = originalName.toLowerCase().endsWith('.csv');

    if (isCsv) {
      return this.parseCsv(filePath);
    } else {
      return this.parsePdf(filePath);
    }
  }

  /**
   * Extracts text from PDF with layout preservation.
   * Tries `pdftotext -layout` first, falls back to `PDFParse`.
   */
  private static async extractPdfText(filePath: string): Promise<string> {
    try {
      const output = execFileSync('pdftotext', ['-layout', filePath, '-'], {
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024
      });
      if (output && output.trim().length > 100) {
        return output;
      }
    } catch {
      // pdftotext not available or errored, fallback to pure js
    }

    // Fallback: PDFParse
    const buffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text || '';
  }

  /**
   * Normalizes any date string (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD) to ISO format YYYY-MM-DD.
   */
  static normalizeDate(dateStr: string): string {
    const trimmed = dateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    const parts = trimmed.split(/[/.-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        // DD/MM/YYYY
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return trimmed;
  }

  /**
   * Parses PDF file.
   */
  static async parsePdf(filePath: string): Promise<ParseResult> {
    const text = await this.extractPdfText(filePath);

    let statementPeriod = AccountDetectorService.detectStatementPeriod(text);
    const currency = AccountDetectorService.detectCurrency(text);
    let accountsMeta = AccountDetectorService.parseAccountSummaryTable(text);

    const lines = text.split('\n');
    const rawTransactions: RawExtractedTransaction[] = [];

    let currentAccountType: AccountType = accountsMeta[0]?.accountType || 'current';
    let currentAccountNumber = accountsMeta[0]?.accountNumber || 'ACC-01';
    let currentMonth = '';
    let currentCurrency = accountsMeta[0]?.currency || currency || 'EGP';

    // Track active table headers
    let headerCol1Idx = -1;
    let headerCol2Idx = -1;
    let headerCol1Type: 'withdrawal' | 'deposit' | 'debit' | 'credit' = 'withdrawal';
    let headerCol2Type: 'withdrawal' | 'deposit' | 'debit' | 'credit' = 'deposit';

    // Running balance per account to validate direction
    const runningBalances: Record<string, number> = {};
    for (const acc of accountsMeta) {
      runningBalances[acc.accountNumber] = acc.beginningBalance;
    }

    // Date regex matches:
    // - YYYY-MM-DD (e.g. 2025-08-01)
    // - DD/MM/YYYY or DD-MM-YYYY (e.g. 05/01/2025)
    const dateRowRegex = /^\s*(\d{4}-\d{2}-\d{2}|\d{2}[/.-]\d{2}[/.-]\d{4})\s+/;
    const amountRegex = /(-?[0-9]{1,3}(?:,[0-9]{3})*\.\d{2}|-?[0-9]+\.\d{2})/g;

    let lastTransaction: RawExtractedTransaction | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines, page headers, footers
      if (!trimmed) {
        lastTransaction = null;
        continue;
      }

      if (
        trimmed.startsWith('NILE DEMO BANK EGYPT - ANNUAL COMBINED STATEMENT (CONTINUED)') ||
        trimmed.startsWith('Synthetic sample statement') ||
        trimmed.startsWith('ACCOUNT SUMMARY') ||
        trimmed.startsWith('Total') ||
        trimmed.startsWith('TOTAL') ||
        trimmed.startsWith('Page ') ||
        trimmed.includes('Page 1 of') ||
        trimmed.includes('Page 2 of') ||
        trimmed.includes('This statement will be considered correct')
      ) {
        lastTransaction = null;
        continue;
      }

      // Check for Section Header: e.g. "August 2025 - Current Account 10004472183-01 - Egyptian Pound (EGP)"
      const secHeader = AccountDetectorService.parseSectionHeader(trimmed);
      if (secHeader) {
        currentMonth = secHeader.month;
        currentAccountType = secHeader.accountType;
        currentAccountNumber = secHeader.accountNumber;
        currentCurrency = secHeader.currency;
        lastTransaction = null;
        continue;
      }

      // Check for standalone Account Type header lines (e.g. QNB or CIB)
      if (/CURRENT\s+ACCOUNT/i.test(trimmed) && /QATARI\s+RIYAL|EGP|USD/i.test(trimmed)) {
        currentAccountType = 'current';
        lastTransaction = null;
      }

      // Check for Column Headers line
      const upperLine = line.toUpperCase();
      if (upperLine.includes('WITHDRAWAL') && upperLine.includes('DEPOSIT')) {
        headerCol1Idx = upperLine.indexOf('WITHDRAWAL');
        headerCol2Idx = upperLine.indexOf('DEPOSIT');
        headerCol1Type = 'withdrawal';
        headerCol2Type = 'deposit';
        lastTransaction = null;
        continue;
      }

      if (upperLine.includes('DEBIT') && upperLine.includes('CREDIT')) {
        const debitIdx = upperLine.indexOf('DEBIT');
        const creditIdx = upperLine.indexOf('CREDIT');
        if (debitIdx < creditIdx) {
          headerCol1Idx = debitIdx;
          headerCol2Idx = creditIdx;
          headerCol1Type = 'debit';
          headerCol2Type = 'credit';
        } else {
          // e.g. CIB has Credit before Debit
          headerCol1Idx = creditIdx;
          headerCol2Idx = debitIdx;
          headerCol1Type = 'credit';
          headerCol2Type = 'debit';
        }
        lastTransaction = null;
        continue;
      }

      // Skip standalone Opening/Closing balance lines
      if (/^(?:OPENING\s+BALANCE|CLOSING\s+BALANCE)/i.test(trimmed)) {
        lastTransaction = null;
        continue;
      }

      // Check for Transaction Row
      const dateMatch = line.match(dateRowRegex);
      if (dateMatch) {
        const rawDate = dateMatch[1];
        const normalizedDate = this.normalizeDate(rawDate);

        // Find all numbers in line
        const amountMatches = Array.from(line.matchAll(amountRegex));

        if (amountMatches.length >= 2) {
          const balanceMatch = amountMatches[amountMatches.length - 1];
          const amtMatch = amountMatches[amountMatches.length - 2];

          const rawAmtVal = parseFloat(amtMatch[1].replace(/,/g, ''));
          const amtVal = Math.abs(rawAmtVal);
          const balVal = parseFloat(balanceMatch[1].replace(/,/g, ''));

          // Description between date and first amount
          const datePosInLine = line.indexOf(rawDate);
          const descStart = datePosInLine + rawDate.length;
          const descEnd = amtMatch.index ?? descStart;
          let description = line.substring(descStart, descEnd).trim();

          // Strip references or clean up description if starts with reference number
          description = description.replace(/^\d{5,}\s+/, '').trim();

          // Determine column direction (withdrawal/debit vs deposit/credit)
          let colType: 'withdrawal' | 'deposit' | 'debit' | 'credit';

          // Rule 1: Negative amount explicitly means money out
          if (rawAmtVal < 0) {
            colType = currentAccountType === 'credit_card' ? 'debit' : 'withdrawal';
          } else {
            // Rule 2: Mathematical running balance delta check
            const prevBal = runningBalances[currentAccountNumber];
            if (prevBal !== undefined && Math.abs(prevBal - balVal) > 0.001) {
              const delta = balVal - prevBal;
              if (currentAccountType === 'credit_card') {
                // In credit card: +delta = purchase/interest (credit), -delta = autopay/payment (debit)
                colType = delta > 0 ? 'credit' : 'debit';
              } else {
                // In current/savings: +delta = deposit, -delta = withdrawal
                colType = delta > 0 ? 'deposit' : 'withdrawal';
              }
            } else {
              // Rule 3: Visual column alignment against detected headers
              const amtStartIndex = amtMatch.index ?? 0;
              if (headerCol1Idx >= 0 && headerCol2Idx >= 0) {
                const dist1 = Math.abs(amtStartIndex - headerCol1Idx);
                const dist2 = Math.abs(amtStartIndex - headerCol2Idx);
                colType = dist1 < dist2 ? headerCol1Type : headerCol2Type;
              } else {
                // Fallback default
                colType = 'withdrawal';
              }
            }
          }

          // Update running balance
          runningBalances[currentAccountNumber] = balVal;

          const tx: RawExtractedTransaction = {
            date: normalizedDate,
            description,
            amount: amtVal,
            columnType: colType,
            balance: balVal,
            accountType: currentAccountType,
            accountNumber: currentAccountNumber,
            currency: currentCurrency,
            month: currentMonth,
            rawLine: trimmed
          };

          rawTransactions.push(tx);
          lastTransaction = tx;
          continue;
        }
      }

      // If line is not a date row, but follows a transaction row, check for multi-line description details
      if (lastTransaction && trimmed.length > 2 && !line.match(/^[0-9,.\s-]+$/)) {
        // Exclude system lines like addresses or disclaimers
        if (
          !trimmed.includes('Al Sadd Street') &&
          !trimmed.includes('Doha') &&
          !trimmed.includes('Page ') &&
          !trimmed.includes('VERIFIED') &&
          !trimmed.includes('P.O. Box') &&
          !/^\d{2}\/\d{2}\s+\d{4}/.test(trimmed)
        ) {
          // If it looks like a merchant or detail line (e.g. POS LULU HYPERMARKET, KAHRAMAA, MONA AL-SAYED)
          if (!lastTransaction.description.includes(trimmed)) {
            // Avoid adding pure card numbers
            if (!/^[0-9X]{15,}$/.test(trimmed)) {
              lastTransaction.description += ` - ${trimmed}`;
            }
          }
        }
      }
    }

    // Auto-compute statement period from transactions if not present
    if ((!statementPeriod.start || !statementPeriod.end) && rawTransactions.length > 0) {
      const sortedDates = rawTransactions.map((t) => t.date).sort();
      statementPeriod = {
        start: sortedDates[0],
        end: sortedDates[sortedDates.length - 1]
      };
    }

    // If accountsMeta was empty or needs balance sync
    if (accountsMeta.length === 0 && rawTransactions.length > 0) {
      const firstTx = rawTransactions[0];
      const lastTx = rawTransactions[rawTransactions.length - 1];
      accountsMeta.push({
        accountNumber: currentAccountNumber,
        accountType: currentAccountType,
        accountName:
          currentAccountType === 'current'
            ? 'Current Account'
            : currentAccountType === 'savings'
            ? 'Savings Account'
            : 'Credit Card',
        currency: currentCurrency,
        beginningBalance: firstTx.balance ?? 0,
        endingBalance: lastTx.balance ?? 0
      });
    }

    return {
      rawTransactions,
      accountsMeta,
      statementPeriod,
      currency
    };
  }

  /**
   * Parses CSV file.
   * Supports standard exports with Date, Description, Amount/Withdrawal, Deposit, Balance, Account columns.
   */
  static async parseCsv(filePath: string): Promise<ParseResult> {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parseCsvSync(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as Record<string, string>[];

    const rawTransactions: RawExtractedTransaction[] = [];
    const accountsMetaMap = new Map<string, StatementAccountMeta>();
    let detectedCurrency = 'EGP';

    records.forEach((row) => {
      // Find date
      const date = row['Date'] || row['date'] || row['DATE'] || row['Transaction Date'] || '';
      // Find description
      const desc =
        row['Description'] ||
        row['description'] ||
        row['DESCRIPTION'] ||
        row['Details'] ||
        row['Memo'] ||
        'Transaction';

      // Find account
      const rawAccount =
        row['Account'] ||
        row['account'] ||
        row['Account Type'] ||
        row['Account Name'] ||
        'Current Account';
      const accountNumber =
        row['Account Number'] || row['accountNumber'] || row['Account #'] || '10004472183-01';
      const accountType = AccountDetectorService.normalizeAccountType(rawAccount);

      // Currency
      if (row['Currency'] || row['currency']) {
        detectedCurrency = row['Currency'] || row['currency'];
      }

      // Amounts
      const withdrawalRaw = row['Withdrawal'] || row['withdrawal'] || row['Debit'] || row['debit'] || '';
      const depositRaw = row['Deposit'] || row['deposit'] || row['Credit'] || row['credit'] || '';
      const amountRaw = row['Amount'] || row['amount'] || '';
      const balanceRaw = row['Balance'] || row['balance'] || '';

      const balanceVal = balanceRaw ? parseFloat(balanceRaw.replace(/,/g, '')) : null;

      let colType: 'withdrawal' | 'deposit' | 'debit' | 'credit' = 'withdrawal';
      let amountVal = 0;

      if (withdrawalRaw && parseFloat(withdrawalRaw.replace(/,/g, '')) > 0) {
        amountVal = parseFloat(withdrawalRaw.replace(/,/g, ''));
        colType = accountType === 'credit_card' ? 'debit' : 'withdrawal';
      } else if (depositRaw && parseFloat(depositRaw.replace(/,/g, '')) > 0) {
        amountVal = parseFloat(depositRaw.replace(/,/g, ''));
        colType = accountType === 'credit_card' ? 'credit' : 'deposit';
      } else if (amountRaw) {
        const num = parseFloat(amountRaw.replace(/,/g, ''));
        amountVal = Math.abs(num);
        if (num < 0) {
          colType = accountType === 'credit_card' ? 'debit' : 'withdrawal';
        } else {
          colType = accountType === 'credit_card' ? 'credit' : 'deposit';
        }
      }

      if (amountVal > 0 && date) {
        const normalizedDate = this.normalizeDate(date);
        rawTransactions.push({
          date: normalizedDate,
          description: desc,
          amount: amountVal,
          columnType: colType,
          balance: balanceVal,
          accountType,
          accountNumber,
          currency: detectedCurrency,
          rawLine: JSON.stringify(row)
        });

        if (!accountsMetaMap.has(accountNumber)) {
          accountsMetaMap.set(accountNumber, {
            accountNumber,
            accountType,
            accountName: rawAccount,
            currency: detectedCurrency,
            beginningBalance: 0,
            endingBalance: balanceVal ?? 0
          });
        }
      }
    });

    const dates = rawTransactions.map((t) => t.date).sort();
    const statementPeriod = {
      start: dates[0] || '',
      end: dates[dates.length - 1] || ''
    };

    return {
      rawTransactions,
      accountsMeta: Array.from(accountsMetaMap.values()),
      statementPeriod,
      currency: detectedCurrency
    };
  }
}
