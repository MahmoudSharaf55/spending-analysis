import path from 'path';
import { fileURLToPath } from 'url';
import { StatementParserService } from './services/statementParser.service.js';
import { TransactionNormalizerService } from './services/transactionNormalizer.service.js';
import { TransactionCategorizerService } from './services/transactionCategorizer.service.js';
import { FinancialAnalysisService } from './services/financialAnalysis.service.js';
import { InsightsGeneratorService } from './services/insightsGenerator.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testFile(filePath: string, name: string) {
  console.log(`\n========================================\nTesting: ${name}\n========================================`);
  const parseResult = await StatementParserService.parseFile(filePath, name);
  console.log(`Parsed ${parseResult.rawTransactions.length} raw transactions.`);
  console.log('Currency detected:', parseResult.currency);
  console.log('Period detected:', parseResult.statementPeriod);
  console.log('Accounts detected:', parseResult.accountsMeta);

  const normalized = TransactionNormalizerService.normalizeAll(parseResult.rawTransactions);
  const { transactions: categorized, aiUsed } = await TransactionCategorizerService.categorizeTransactions(normalized);

  const report = FinancialAnalysisService.generateReport(
    categorized,
    parseResult.accountsMeta,
    parseResult.statementPeriod,
    parseResult.currency,
    name,
    'pdf',
    aiUsed,
    []
  );

  const insights = await InsightsGeneratorService.generateInsights(
    report.overallSummary,
    report.spendingAnalysis,
    report.incomeAnalysis,
    report.accounts,
    report.currency
  );
  report.insights = insights;

  console.log('Summary:', {
    totalIncome: report.overallSummary.totalIncome,
    totalExpenses: report.overallSummary.totalExpenses,
    netCashFlow: report.overallSummary.netCashFlow,
    txCount: report.overallSummary.transactionCount
  });

  console.log('Accounts reconciliation:');
  for (const acc of report.accounts) {
    console.log(` - ${acc.accountName} (${acc.accountNumber}): Beg=${acc.beginningBalance}, End=${acc.endingBalance}, Calc=${acc.calculatedEndingBalance}, Reconciled=${acc.reconciled}`);
  }

  console.log('Top transactions:');
  for (const tx of report.transactions.slice(0, 5)) {
    console.log(`  [${tx.date}] ${tx.description} | ${tx.flowType} | ${tx.category} | ${tx.amount} ${tx.currency}`);
  }
}

async function main() {
  const tests = [
    { path: path.resolve(__dirname, '../../statements-sample/Testing bank statements.pdf'), name: 'Testing bank statements.pdf' },
    { path: path.resolve(__dirname, '../../statements-sample/qnb-statement-1.pdf'), name: 'qnb-statement-1.pdf' },
    { path: path.resolve(__dirname, '../../statements-sample/cib-statement-1.pdf'), name: 'cib-statement-1.pdf' }
  ];

  for (const t of tests) {
    await testFile(t.path, t.name);
  }
}

main().catch(console.error);
