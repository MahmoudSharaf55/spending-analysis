import type { Transaction, FinancialReport } from '../types';

interface ExportCSVOptions {
  transactions: Transaction[];
  currency?: string;
  filename?: string;
  lang?: 'en' | 'ar';
}

/**
 * Escapes a cell value for standard CSV format.
 * Wraps in quotes and escapes internal quotes.
 */
function escapeCSV(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports transaction list to a clean, UTF-8 BOM encoded CSV file.
 * The BOM (\uFEFF) ensures that Microsoft Excel on Windows/Mac properly parses
 * Arabic characters and localized text without encoding corruption.
 */
export function exportTransactionsToCSV({
  transactions,
  currency = 'EGP',
  filename = 'statement_transactions.csv',
  lang = 'en'
}: ExportCSVOptions): void {
  const isAr = lang === 'ar';

  const headers = isAr
    ? [
        'التاريخ',
        'الوصف',
        'رقم الحساب',
        'نوع الحساب',
        'نوع التدفق',
        'الفئة',
        'المبلغ',
        'العملة',
        'الرصيد بعد المعاملة',
        'مستوى الثقة'
      ]
    : [
        'Date',
        'Description',
        'Account Number',
        'Account Type',
        'Flow Type',
        'Category',
        'Amount',
        'Currency',
        'Balance',
        'Confidence'
      ];

  const rows = transactions.map((tx) => [
    escapeCSV(tx.date),
    escapeCSV(tx.description),
    escapeCSV(tx.accountNumber || ''),
    escapeCSV(tx.accountType || ''),
    escapeCSV(tx.flowType || ''),
    escapeCSV(tx.category || ''),
    escapeCSV(tx.amount.toFixed(2)),
    escapeCSV(tx.currency || currency),
    escapeCSV(tx.balance !== undefined && tx.balance !== null ? tx.balance.toFixed(2) : ''),
    escapeCSV(tx.categoryConfidence ? `${Math.round(tx.categoryConfidence * 100)}%` : '')
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Excel Arabic support
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Exports complete Executive Summary & Metrics as a structured CSV report.
 */
export function exportExecutiveSummaryToCSV(
  report: FinancialReport,
  lang: 'en' | 'ar' = 'en'
): void {
  try {
    const isAr = lang === 'ar';
    const currency = report.currency;

    const totalIncome = report.overallSummary?.totalIncome || 0;
    const totalExpenses = report.overallSummary?.totalExpenses || 0;
    const netCashFlow = report.overallSummary?.netCashFlow || (totalIncome - totalExpenses);
    const savingsRate =
      totalIncome > 0
        ? ((totalIncome - totalExpenses) / totalIncome) * 100
        : 0;
    const burnRate = report.spendingAnalysis?.averageExpense || 0;

    const lines: string[] = [];

    // Title
    lines.push(escapeCSV(isAr ? 'التقرير المالي التنفيذي' : 'Executive Financial Statement Report'));
    lines.push(
      `${escapeCSV(isAr ? 'فترة الكشف' : 'Statement Period')},${escapeCSV(
        `${report.statementPeriod?.start || ''} to ${report.statementPeriod?.end || ''}`
      )}`
    );
    lines.push(`${escapeCSV(isAr ? 'العملة' : 'Currency')},${escapeCSV(currency)}`);
    lines.push('');

    // Overview Metrics
    lines.push(escapeCSV(isAr ? '--- المؤشرات المالية الرئيسية ---' : '--- Key Financial Metrics ---'));
    lines.push(`${escapeCSV(isAr ? 'إجمالي الدخل' : 'Total Income')},${escapeCSV(totalIncome.toFixed(2))}`);
    lines.push(`${escapeCSV(isAr ? 'إجمالي النفقات' : 'Total Actual Expenses')},${escapeCSV(totalExpenses.toFixed(2))}`);
    lines.push(`${escapeCSV(isAr ? 'صافي التدفق النقدي' : 'Net Cash Flow')},${escapeCSV(netCashFlow.toFixed(2))}`);
    lines.push(`${escapeCSV(isAr ? 'معدل الادخار' : 'Savings Rate')},${escapeCSV(`${savingsRate.toFixed(1)}%`)}`);
    lines.push(`${escapeCSV(isAr ? 'معدل الحرق الشهري' : 'Monthly Burn Rate')},${escapeCSV(burnRate.toFixed(2))}`);
    lines.push('');

    // Category Breakdown
    lines.push(escapeCSV(isAr ? '--- النفقات حسب الفئة ---' : '--- Spending by Category ---'));
    lines.push(
      isAr
        ? ['الفئة', 'المبلغ', 'النسبة %', 'عدد المعاملات'].map(escapeCSV).join(',')
        : ['Category', 'Amount', 'Share %', 'Transaction Count'].map(escapeCSV).join(',')
    );

    const categories = report.spendingAnalysis?.categoryBreakdown || [];
    for (const cat of categories) {
      lines.push(
        [
          escapeCSV(cat.category),
          escapeCSV(cat.amount.toFixed(2)),
          escapeCSV(`${(cat.percentage || 0).toFixed(1)}%`),
          escapeCSV(cat.count)
        ].join(',')
      );
    }
    lines.push('');

    // Account Summaries
    lines.push(escapeCSV(isAr ? '--- تفاصيل الحسابات البنكية ---' : '--- Bank Accounts Breakdown ---'));
    lines.push(
      isAr
        ? ['الحساب', 'النوع', 'الرصيد الافتتاحي', 'الرصيد الختامي', 'الإيداعات', 'السحوبات'].map(escapeCSV).join(',')
        : ['Account', 'Type', 'Beginning Balance', 'Ending Balance', 'Total Deposits', 'Total Withdrawals'].map(escapeCSV).join(',')
    );

    const accounts = report.accounts || [];
    for (const acc of accounts) {
      lines.push(
        [
          escapeCSV(acc.accountNumber),
          escapeCSV(acc.accountType),
          escapeCSV(acc.beginningBalance?.toFixed(2) || '0.00'),
          escapeCSV(acc.endingBalance?.toFixed(2) || '0.00'),
          escapeCSV(acc.totalDepositsOrCredits?.toFixed(2) || '0.00'),
          escapeCSV(acc.totalWithdrawalsOrDebits?.toFixed(2) || '0.00')
        ].join(',')
      );
    }

    const csvContent = '\uFEFF' + lines.join('\r\n');
    const startPeriod = report.statementPeriod?.start || 'start';
    const endPeriod = report.statementPeriod?.end || 'end';
    const filename = `financial_executive_summary_${startPeriod}_${endPeriod}.csv`;
    downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
  } catch (err) {
    console.error('Error generating executive summary CSV:', err);
  }
}

/**
 * Triggers client-side browser file download for a generated string/blob.
 */
function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
