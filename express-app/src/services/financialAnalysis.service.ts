import {
  AccountSummary,
  CategoryBreakdown,
  FinancialReport,
  IncomeAnalysis,
  MonthlyCashFlow,
  MonthlyIncome,
  MonthlySpending,
  OverallSummary,
  RecurringExpense,
  SpendingAnalysis,
  StatementAccountMeta,
  Transaction
} from '../types/index.js';

export class FinancialAnalysisService {
  /**
   * Generates a complete financial analysis report from normalized and categorized transactions.
   */
  static generateReport(
    transactions: Transaction[],
    accountsMeta: StatementAccountMeta[],
    statementPeriod: { start: string; end: string },
    currency: string,
    fileName: string,
    fileType: 'pdf' | 'csv',
    aiCategorizationUsed: boolean,
    insights: string[]
  ): FinancialReport {
    // 1. Calculate Account Summaries and reconcile running balances
    const accounts = this.calculateAccountSummaries(transactions, accountsMeta, currency);

    // 2. Calculate Overall Summary
    const overallSummary = this.calculateOverallSummary(transactions, accounts);

    // 3. Calculate Spending Analysis
    const spendingAnalysis = this.calculateSpendingAnalysis(transactions);

    // 4. Calculate Income Analysis
    const incomeAnalysis = this.calculateIncomeAnalysis(transactions);

    // 5. Calculate Monthly Cash Flow
    const monthlyCashFlow = this.calculateMonthlyCashFlow(transactions);

    return {
      statementPeriod,
      currency: currency || 'EGP',
      overallSummary,
      spendingAnalysis,
      incomeAnalysis,
      monthlyCashFlow,
      accounts,
      transactions,
      insights,
      metadata: {
        fileName,
        fileType,
        processedAt: new Date().toISOString(),
        aiCategorizationUsed,
        aiInsightsUsed: insights.length > 0
      }
    };
  }

  /**
   * Calculate account metrics and reconcile with statement summary.
   */
  private static calculateAccountSummaries(
    transactions: Transaction[],
    accountsMeta: StatementAccountMeta[],
    defaultCurrency: string
  ): AccountSummary[] {
    const summaryMap = new Map<string, AccountSummary>();

    // Initialize with metadata if available
    for (const meta of accountsMeta) {
      summaryMap.set(meta.accountNumber, {
        accountNumber: meta.accountNumber,
        accountType: meta.accountType,
        accountName: meta.accountName,
        currency: meta.currency || defaultCurrency,
        beginningBalance: meta.beginningBalance,
        endingBalance: meta.endingBalance,
        calculatedEndingBalance: meta.beginningBalance,
        reconciled: false,
        totalDepositsOrCredits: 0,
        totalWithdrawalsOrDebits: 0,
        transactionCount: 0
      });
    }

    // Process transactions per account
    for (const tx of transactions) {
      let acc = summaryMap.get(tx.accountNumber);
      if (!acc) {
        // Auto-create if not in statement summary
        acc = {
          accountNumber: tx.accountNumber,
          accountType: tx.accountType,
          accountName:
            tx.accountType === 'current'
              ? 'Current Account'
              : tx.accountType === 'savings'
              ? 'Savings Account'
              : 'Credit Card',
          currency: tx.currency || defaultCurrency,
          beginningBalance: 0,
          endingBalance: 0,
          calculatedEndingBalance: 0,
          reconciled: false,
          totalDepositsOrCredits: 0,
          totalWithdrawalsOrDebits: 0,
          transactionCount: 0
        };
        summaryMap.set(tx.accountNumber, acc);
      }

      acc.transactionCount++;

      if (tx.accountType === 'credit_card') {
        // In credit card:
        // DEBIT = payment (reduces balance)
        // CREDIT = purchase / interest charge (increases balance)
        const colType = tx.originalData?.columnType;
        if (colType === 'debit' || tx.flowType === 'DEBT_PAYMENT') {
          acc.totalWithdrawalsOrDebits += tx.amount;
        } else {
          acc.totalDepositsOrCredits += tx.amount;
        }
      } else {
        // Current and savings:
        // Deposit increases balance, Withdrawal decreases balance
        const colType = tx.originalData?.columnType;
        if (colType === 'deposit' || tx.direction === 'credit') {
          acc.totalDepositsOrCredits += tx.amount;
        } else {
          acc.totalWithdrawalsOrDebits += tx.amount;
        }
      }
    }

    // Compute calculated ending balance and check reconciliation
    for (const acc of summaryMap.values()) {
      if (acc.accountType === 'credit_card') {
        acc.calculatedEndingBalance =
          acc.beginningBalance + acc.totalDepositsOrCredits - acc.totalWithdrawalsOrDebits;
      } else {
        acc.calculatedEndingBalance =
          acc.beginningBalance + acc.totalDepositsOrCredits - acc.totalWithdrawalsOrDebits;
      }

      acc.calculatedEndingBalance = Math.round(acc.calculatedEndingBalance * 100) / 100;
      acc.totalDepositsOrCredits = Math.round(acc.totalDepositsOrCredits * 100) / 100;
      acc.totalWithdrawalsOrDebits = Math.round(acc.totalWithdrawalsOrDebits * 100) / 100;

      acc.reconciled =
        acc.endingBalance > 0
          ? Math.abs(acc.calculatedEndingBalance - acc.endingBalance) < 0.05
          : true;
    }

    return Array.from(summaryMap.values());
  }

  /**
   * Overall Summary computation
   */
  private static calculateOverallSummary(
    transactions: Transaction[],
    accounts: AccountSummary[]
  ): OverallSummary {
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalInternalTransfers = 0;
    let totalCreditCardPayments = 0;
    let totalInterestEarned = 0;
    let totalInterestCharged = 0;

    for (const tx of transactions) {
      switch (tx.flowType) {
        case 'INCOME':
          totalIncome += tx.amount;
          break;
        case 'INTEREST_INCOME':
          totalInterestEarned += tx.amount;
          break;
        case 'EXPENSE':
          totalExpenses += tx.amount;
          break;
        case 'INTEREST_EXPENSE':
          totalInterestCharged += tx.amount;
          totalExpenses += tx.amount; // Interest charged is an actual expense
          break;
        case 'INTERNAL_TRANSFER':
          // Internal transfers are money moved between user's own accounts
          // Only count one side (e.g., withdrawals/transfer-outs) to avoid double counting transfer volume
          if (tx.direction === 'debit') {
            totalInternalTransfers += tx.amount;
          }
          break;
        case 'DEBT_PAYMENT':
          totalCreditCardPayments += tx.amount;
          break;
        default:
          break;
      }
    }

    // Total actual expenses includes merchant purchases and interest charges
    const netCashFlow = totalIncome + totalInterestEarned - totalExpenses;

    const ccAccount = accounts.find((a) => a.accountType === 'credit_card');
    const creditCardEndingLiability = ccAccount ? ccAccount.calculatedEndingBalance : 0;

    return {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netCashFlow: Math.round(netCashFlow * 100) / 100,
      transactionCount: transactions.length,
      totalInternalTransfers: Math.round(totalInternalTransfers * 100) / 100,
      totalCreditCardPayments: Math.round(totalCreditCardPayments * 100) / 100,
      totalInterestEarned: Math.round(totalInterestEarned * 100) / 100,
      totalInterestCharged: Math.round(totalInterestCharged * 100) / 100,
      creditCardEndingLiability: Math.round(creditCardEndingLiability * 100) / 100
    };
  }

  /**
   * Spending analysis computation
   */
  private static calculateSpendingAnalysis(transactions: Transaction[]): SpendingAnalysis {
    const expenseTxs = transactions.filter(
      (tx) => tx.flowType === 'EXPENSE' || tx.flowType === 'INTEREST_EXPENSE'
    );

    // Group by category
    const catMap = new Map<string, { amount: number; count: number }>();
    let totalExpenseAmount = 0;

    for (const tx of expenseTxs) {
      const cat = tx.category || 'Other';
      const existing = catMap.get(cat) || { amount: 0, count: 0 };
      existing.amount += tx.amount;
      existing.count += 1;
      catMap.set(cat, existing);
      totalExpenseAmount += tx.amount;
    }

    const categoryBreakdown: CategoryBreakdown[] = Array.from(catMap.entries())
      .map(([category, { amount, count }]) => ({
        category,
        amount: Math.round(amount * 100) / 100,
        count,
        percentage:
          totalExpenseAmount > 0 ? Math.round((amount / totalExpenseAmount) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // Group by month
    const monthMap = new Map<string, { total: number; count: number }>();
    for (const tx of expenseTxs) {
      const month = tx.date.substring(0, 7); // YYYY-MM
      const existing = monthMap.get(month) || { total: 0, count: 0 };
      existing.total += tx.amount;
      existing.count += 1;
      monthMap.set(month, existing);
    }

    const monthlySpending: MonthlySpending[] = Array.from(monthMap.entries())
      .map(([month, { total, count }]) => ({
        month,
        total: Math.round(total * 100) / 100,
        count
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const highestCategory =
      categoryBreakdown.length > 0
        ? { category: categoryBreakdown[0].category, amount: categoryBreakdown[0].amount }
        : null;

    const averageExpense =
      expenseTxs.length > 0 ? Math.round((totalExpenseAmount / expenseTxs.length) * 100) / 100 : 0;

    // Detect recurring expenses (descriptions that occur in 3 or more distinct months)
    const descMonthMap = new Map<string, { months: Set<string>; amounts: number[] }>();
    for (const tx of expenseTxs) {
      const key = tx.description.toUpperCase();
      const month = tx.date.substring(0, 7);
      const existing = descMonthMap.get(key) || { months: new Set<string>(), amounts: [] };
      existing.months.add(month);
      existing.amounts.push(tx.amount);
      descMonthMap.set(key, existing);
    }

    const recurringExpenses: RecurringExpense[] = [];
    for (const [description, { months, amounts }] of descMonthMap.entries()) {
      if (months.size >= 3) {
        const sum = amounts.reduce((a, b) => a + b, 0);
        recurringExpenses.push({
          description,
          frequency: amounts.length,
          avgAmount: Math.round((sum / amounts.length) * 100) / 100,
          totalAmount: Math.round(sum * 100) / 100
        });
      }
    }
    recurringExpenses.sort((a, b) => b.totalAmount - a.totalAmount);

    // Largest individual expenses
    const largestExpenses = [...expenseTxs]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return {
      categoryBreakdown,
      monthlySpending,
      highestCategory,
      averageExpense,
      recurringExpenses,
      largestExpenses
    };
  }

  /**
   * Income analysis computation
   */
  private static calculateIncomeAnalysis(transactions: Transaction[]): IncomeAnalysis {
    const incomeTxs = transactions.filter(
      (tx) => tx.flowType === 'INCOME' || tx.flowType === 'INTEREST_INCOME'
    );

    let totalSalary = 0;
    let totalFreelance = 0;
    let totalInterest = 0;
    let otherIncome = 0;

    const monthMap = new Map<
      string,
      { salary: number; freelance: number; interest: number; other: number; total: number }
    >();

    for (const tx of incomeTxs) {
      const month = tx.date.substring(0, 7);
      const desc = tx.description.toUpperCase();
      const monthEntry = monthMap.get(month) || {
        salary: 0,
        freelance: 0,
        interest: 0,
        other: 0,
        total: 0
      };

      if (tx.flowType === 'INTEREST_INCOME') {
        totalInterest += tx.amount;
        monthEntry.interest += tx.amount;
      } else if (desc.includes('SALARY')) {
        totalSalary += tx.amount;
        monthEntry.salary += tx.amount;
      } else if (desc.includes('FREELANCE') || desc.includes('UPWORK')) {
        totalFreelance += tx.amount;
        monthEntry.freelance += tx.amount;
      } else {
        otherIncome += tx.amount;
        monthEntry.other += tx.amount;
      }

      monthEntry.total += tx.amount;
      monthMap.set(month, monthEntry);
    }

    const monthlyIncome: MonthlyIncome[] = Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        salary: Math.round(data.salary * 100) / 100,
        freelance: Math.round(data.freelance * 100) / 100,
        interest: Math.round(data.interest * 100) / 100,
        other: Math.round(data.other * 100) / 100,
        total: Math.round(data.total * 100) / 100
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalSalary: Math.round(totalSalary * 100) / 100,
      totalFreelance: Math.round(totalFreelance * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      otherIncome: Math.round(otherIncome * 100) / 100,
      monthlyIncome
    };
  }

  /**
   * Monthly Cash Flow (income vs expenses)
   */
  private static calculateMonthlyCashFlow(transactions: Transaction[]): MonthlyCashFlow[] {
    const monthSet = new Set<string>();
    const incomeMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();

    for (const tx of transactions) {
      const month = tx.date.substring(0, 7);
      monthSet.add(month);

      if (tx.flowType === 'INCOME' || tx.flowType === 'INTEREST_INCOME') {
        incomeMap.set(month, (incomeMap.get(month) || 0) + tx.amount);
      } else if (tx.flowType === 'EXPENSE' || tx.flowType === 'INTEREST_EXPENSE') {
        expenseMap.set(month, (expenseMap.get(month) || 0) + tx.amount);
      }
    }

    const sortedMonths = Array.from(monthSet).sort();
    return sortedMonths.map((m) => {
      const inc = Math.round((incomeMap.get(m) || 0) * 100) / 100;
      const exp = Math.round((expenseMap.get(m) || 0) * 100) / 100;
      return {
        month: m,
        income: inc,
        expenses: exp,
        net: Math.round((inc - exp) * 100) / 100
      };
    });
  }
}
