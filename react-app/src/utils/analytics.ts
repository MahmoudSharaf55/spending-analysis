import type {
  Transaction,
  CategoryBreakdown,
  MonthlySpending,
  MonthlyCashFlow,
  SpendingAnalysis
} from '../types';

export interface FilteredTotals {
  totalIncome: number;
  totalExpenses: number;
  totalTransfers: number;
  netAmount: number;
  count: number;
}

export interface DerivedAnalytics {
  spending: SpendingAnalysis;
  monthlyCashFlow: MonthlyCashFlow[];
  totals: FilteredTotals;
}

/**
 * Computes category breakdown, monthly spending, monthly cash flow, and totals
 * dynamically for any subset of transactions (e.g. filtered by date range).
 */
export function computeFilteredAnalytics(
  transactions: Transaction[]
): DerivedAnalytics {
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalTransfers = 0;

  const expenseTxs: Transaction[] = [];
  const incomeTxs: Transaction[] = [];

  for (const tx of transactions) {
    if (tx.flowType === 'INCOME' || tx.flowType === 'INTEREST_INCOME') {
      totalIncome += tx.amount;
      incomeTxs.push(tx);
    } else if (tx.flowType === 'EXPENSE' || tx.flowType === 'INTEREST_EXPENSE') {
      totalExpenses += tx.amount;
      expenseTxs.push(tx);
    } else if (tx.flowType === 'INTERNAL_TRANSFER') {
      totalTransfers += tx.amount;
    }
  }

  // 1. Category Breakdown for expenses
  const catMap = new Map<string, { amount: number; count: number }>();
  for (const tx of expenseTxs) {
    const cat = tx.category || 'Other';
    const existing = catMap.get(cat) || { amount: 0, count: 0 };
    existing.amount += tx.amount;
    existing.count += 1;
    catMap.set(cat, existing);
  }

  const categoryBreakdown: CategoryBreakdown[] = Array.from(catMap.entries())
    .map(([category, { amount, count }]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      count,
      percentage:
        totalExpenses > 0 ? Math.round((amount / totalExpenses) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  // 2. Monthly Spending
  const monthExpenseMap = new Map<string, { total: number; count: number }>();
  for (const tx of expenseTxs) {
    const month = tx.date.substring(0, 7);
    const existing = monthExpenseMap.get(month) || { total: 0, count: 0 };
    existing.total += tx.amount;
    existing.count += 1;
    monthExpenseMap.set(month, existing);
  }

  const monthlySpending: MonthlySpending[] = Array.from(monthExpenseMap.entries())
    .map(([month, { total, count }]) => ({
      month,
      total: Math.round(total * 100) / 100,
      count
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // 3. Monthly Income & Cash Flow
  const monthIncomeMap = new Map<string, number>();
  for (const tx of incomeTxs) {
    const month = tx.date.substring(0, 7);
    const existing = monthIncomeMap.get(month) || 0;
    monthIncomeMap.set(month, existing + tx.amount);
  }

  const allMonths = Array.from(
    new Set([...monthExpenseMap.keys(), ...monthIncomeMap.keys()])
  ).sort();

  const monthlyCashFlow: MonthlyCashFlow[] = allMonths.map((month) => {
    const exp = monthExpenseMap.get(month)?.total || 0;
    const inc = monthIncomeMap.get(month) || 0;
    return {
      month,
      income: Math.round(inc * 100) / 100,
      expenses: Math.round(exp * 100) / 100,
      net: Math.round((inc - exp) * 100) / 100
    };
  });

  const highestCategory =
    categoryBreakdown.length > 0
      ? { category: categoryBreakdown[0].category, amount: categoryBreakdown[0].amount }
      : null;

  const averageExpense =
    expenseTxs.length > 0
      ? Math.round((totalExpenses / expenseTxs.length) * 100) / 100
      : 0;

  const netAmount = Math.round((totalIncome - totalExpenses) * 100) / 100;

  return {
    spending: {
      categoryBreakdown,
      monthlySpending,
      highestCategory,
      averageExpense,
      recurringExpenses: [],
      largestExpenses: [...expenseTxs].sort((a, b) => b.amount - a.amount).slice(0, 10)
    },
    monthlyCashFlow,
    totals: {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      totalTransfers: Math.round(totalTransfers * 100) / 100,
      netAmount,
      count: transactions.length
    }
  };
}
