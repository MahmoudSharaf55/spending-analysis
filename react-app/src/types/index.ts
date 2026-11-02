export type AccountType = 'current' | 'savings' | 'credit_card' | 'other';

export type FlowType =
  | 'INCOME'
  | 'EXPENSE'
  | 'INTERNAL_TRANSFER'
  | 'DEBT_PAYMENT'
  | 'INTEREST_INCOME'
  | 'INTEREST_EXPENSE'
  | 'UNKNOWN';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  accountType: AccountType;
  accountNumber: string;
  direction: 'debit' | 'credit';
  flowType: FlowType;
  category: string;
  categoryConfidence: number;
  categorySource: 'rule' | 'ai' | 'fallback';
  balance: number | null;
  originalData?: {
    columnType: string;
    rawLine?: string;
  };
}

export interface AccountSummary {
  accountNumber: string;
  accountType: AccountType;
  accountName: string;
  currency: string;
  beginningBalance: number;
  endingBalance: number;
  calculatedEndingBalance: number;
  reconciled: boolean;
  totalDepositsOrCredits: number;
  totalWithdrawalsOrDebits: number;
  transactionCount: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
  percentage: number;
  localizedName?: string;
}

export interface MonthlySpending {
  month: string;
  total: number;
  count: number;
}

export interface MonthlyIncome {
  month: string;
  salary: number;
  freelance: number;
  interest: number;
  other: number;
  total: number;
}

export interface MonthlyCashFlow {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface RecurringExpense {
  description: string;
  avgAmount: number;
  frequency: number;
  totalAmount: number;
}

export interface OverallSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  transactionCount: number;
  totalInternalTransfers: number;
  totalCreditCardPayments: number;
  totalInterestEarned: number;
  totalInterestCharged: number;
  creditCardEndingLiability: number;
}

export interface SpendingAnalysis {
  categoryBreakdown: CategoryBreakdown[];
  monthlySpending: MonthlySpending[];
  highestCategory: { category: string; amount: number } | null;
  averageExpense: number;
  recurringExpenses: RecurringExpense[];
  largestExpenses: Transaction[];
}

export interface IncomeAnalysis {
  totalSalary: number;
  totalFreelance: number;
  totalInterest: number;
  otherIncome: number;
  monthlyIncome: MonthlyIncome[];
}

export interface FinancialReport {
  statementPeriod: {
    start: string;
    end: string;
  };
  currency: string;
  overallSummary: OverallSummary;
  spendingAnalysis: SpendingAnalysis;
  incomeAnalysis: IncomeAnalysis;
  monthlyCashFlow: MonthlyCashFlow[];
  accounts: AccountSummary[];
  transactions: Transaction[];
  insights: string[];
  insightsAr?: string[];
  metadata: {
    fileName: string;
    fileType: 'pdf' | 'csv';
    processedAt: string;
    aiCategorizationUsed: boolean;
    aiInsightsUsed: boolean;
  };
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'en' | 'ar';
