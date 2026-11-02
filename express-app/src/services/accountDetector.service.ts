import { AccountType, StatementAccountMeta } from '../types/index.js';

export class AccountDetectorService {
  /**
   * Detects statement period from document text.
   */
  static detectStatementPeriod(text: string): { start: string; end: string } {
    // Nile Demo format: Statement Period: 2025-08-01 to 2026-07-31
    const periodMatch = text.match(/Statement\s+Period:\s*(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i);
    if (periodMatch) {
      return { start: periodMatch[1], end: periodMatch[2] };
    }

    // Date range format: e.g. 01/01/2025 to 15/01/2025 or PERIOD 02/04/2024
    const ddmmyyyyRange = text.match(/(\d{2}\/\d{2}\/\d{4})\s*(?:to|-)\s*(\d{2}\/\d{2}\/\d{4})/i);
    if (ddmmyyyyRange) {
      return {
        start: this.formatDateToIso(ddmmyyyyRange[1]),
        end: this.formatDateToIso(ddmmyyyyRange[2])
      };
    }

    return { start: '', end: '' };
  }

  /**
   * Normalizes any date string (DD/MM/YYYY or YYYY-MM-DD) to ISO YYYY-MM-DD.
   */
  static formatDateToIso(d: string): string {
    const trimmed = d.trim();
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
   * Detects main currency from text.
   */
  static detectCurrency(text: string): string {
    const upper = text.toUpperCase();
    if (upper.includes('QATARI RIYAL') || upper.includes(' QAR ') || upper.includes('(QAR)')) return 'QAR';
    if (upper.includes('*U.S.D*') || upper.includes('USD') || upper.includes('DOLLAR')) return 'USD';
    if (upper.includes('EGYPTIAN POUND') || upper.includes('EGP')) return 'EGP';
    if (upper.includes('EURO') || upper.includes('EUR')) return 'EUR';
    if (upper.includes('AED') || upper.includes('DIRHAM')) return 'AED';
    if (upper.includes('SAR') || upper.includes('SAUDI RIYAL')) return 'SAR';
    if (upper.includes('GBP') || upper.includes('POUND STERLING')) return 'GBP';
    return 'EGP';
  }

  /**
   * Normalizes account type string into canonical AccountType.
   */
  static normalizeAccountType(rawType: string): AccountType {
    const lower = rawType.toLowerCase();
    if (lower.includes('current')) return 'current';
    if (lower.includes('saving')) return 'savings';
    if (lower.includes('credit')) return 'credit_card';
    return 'other';
  }

  /**
   * Parses account metadata either from multi-account summary tables or single-account headers.
   */
  static parseAccountSummaryTable(text: string): StatementAccountMeta[] {
    const accounts: StatementAccountMeta[] = [];

    // 1. Multi-account summary table (like in Nile Demo statement)
    const summaryRegex = /^([0-9A-Za-z-]+)\s+([A-Za-z\s]+?)\s+([A-Z]{3})\s+([0-9,]+\.\d{2})\s+([0-9,]+\.\d{2})/gm;
    let match;
    while ((match = summaryRegex.exec(text)) !== null) {
      const accNum = match[1].trim();
      const accName = match[2].trim();
      const currency = match[3].trim();
      const beginning = parseFloat(match[4].replace(/,/g, ''));
      const ending = parseFloat(match[5].replace(/,/g, ''));
      const accType = this.normalizeAccountType(accName);

      const existing = accounts.find((a) => a.accountNumber === accNum);
      if (!existing) {
        accounts.push({
          accountNumber: accNum,
          accountType: accType,
          accountName: accName,
          currency,
          beginningBalance: beginning,
          endingBalance: ending
        });
      } else {
        existing.endingBalance = ending;
      }
    }

    if (accounts.length > 0) {
      return accounts;
    }

    // 2. Single Account Detection (like in QNB or CIB statements)
    const singleAccount = this.detectSingleAccount(text);
    if (singleAccount) {
      accounts.push(singleAccount);
    }

    return accounts;
  }

  /**
   * Detects single account headers and opening/closing balances from statements like QNB or CIB.
   */
  static detectSingleAccount(text: string): StatementAccountMeta | null {
    const currency = this.detectCurrency(text);

    // Find account number
    let accountNumber = 'ACC-01';

    // Check IBAN: (QA55QNBA... or similar)
    const ibanMatch = text.match(/\(([A-Z]{2}\d{2}[A-Z0-9]{15,30})\)/);
    // Check formatted account numbers like 0182-627731-001 or 2170120000000154
    const formattedAccMatch = text.match(/\b(\d{4}-\d{6}-\d{3})\b/);
    const longAccMatch = text.match(/(?:ACCOUNT\s+NUMBER|Account\s+No\.?|Account\s*#)[\s\n]+([0-9]{10,20})/i);

    if (formattedAccMatch) {
      accountNumber = formattedAccMatch[1];
    } else if (longAccMatch) {
      accountNumber = longAccMatch[1].trim();
    } else if (ibanMatch) {
      accountNumber = ibanMatch[1].trim();
    }

    // Find account type
    let accountType: AccountType = 'current';
    let accountName = 'Current Account';
    if (/CURRENT\s+ACCOUNT|Personal\s+Current\s+Account/i.test(text)) {
      accountType = 'current';
      accountName = 'Current Account';
    } else if (/SAVINGS?\s+ACCOUNT/i.test(text)) {
      accountType = 'savings';
      accountName = 'Savings Account';
    } else if (/CREDIT\s+CARD/i.test(text)) {
      accountType = 'credit_card';
      accountName = 'Credit Card';
    }

    let beginningBalance = 0;
    let endingBalance = 0;

    // Check CIB style 2-line summary table:
    // OPENING BALANCE TOTAL CREDIT TOTAL DEBIT CLOSING BALANCE
    // 143,514.72 6,149.95 9,701.05 139,963.62
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/OPENING\s+BALANCE/i.test(line) && /CLOSING\s+BALANCE/i.test(line)) {
        // Look ahead for next line with amounts
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const numbers = Array.from(lines[j].matchAll(/([0-9]{1,3}(?:,[0-9]{3})*\.\d{2}|[0-9]+\.\d{2})/g));
          if (numbers.length >= 2) {
            beginningBalance = parseFloat(numbers[0][1].replace(/,/g, ''));
            endingBalance = parseFloat(numbers[numbers.length - 1][1].replace(/,/g, ''));
            break;
          }
        }
      }
    }

    // Check QNB style standalone balance lines:
    // OPENING BALANCE 15420.30
    // CLOSING BALANCE 36365.05
    if (beginningBalance === 0) {
      const openBalMatch = text.match(/OPENING\s+BALANCE[\s:]*([0-9,]+\.\d{2})/i);
      if (openBalMatch) {
        beginningBalance = parseFloat(openBalMatch[1].replace(/,/g, ''));
      }
    }
    if (endingBalance === 0) {
      const closeBalMatch = text.match(/CLOSING\s+BALANCE[\s:]*([0-9,]+\.\d{2})/i);
      if (closeBalMatch) {
        endingBalance = parseFloat(closeBalMatch[1].replace(/,/g, ''));
      }
    }

    return {
      accountNumber,
      accountType,
      accountName,
      currency,
      beginningBalance,
      endingBalance
    };
  }

  /**
   * Parse a section title line like:
   * "August 2025 - Current Account 10004472183-01 - Egyptian Pound (EGP)"
   */
  static parseSectionHeader(line: string): {
    month: string;
    accountType: AccountType;
    accountName: string;
    accountNumber: string;
    currency: string;
  } | null {
    const headerRegex = /^([A-Z][a-z]+ \d{4})\s*-\s*([A-Za-z\s]+?)\s+([0-9A-Za-z-]+)\s*-\s*([^(]+)\s*(?:\(([A-Z]{3})\))?/;
    const m = line.trim().match(headerRegex);
    if (!m) return null;

    const month = m[1].trim();
    const rawAccountName = m[2].trim();
    const accountNumber = m[3].trim();
    const currency = m[5]?.trim() || 'EGP';
    const accountType = this.normalizeAccountType(rawAccountName);

    return {
      month,
      accountType,
      accountName: rawAccountName,
      accountNumber,
      currency
    };
  }
}
