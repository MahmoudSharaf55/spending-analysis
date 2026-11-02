import { OpenRouterService } from './openRouter.service.js';
import {
  OverallSummary,
  SpendingAnalysis,
  IncomeAnalysis,
  AccountSummary
} from '../types/index.js';

export interface BilingualInsights {
  en: string[];
  ar: string[];
}

export class InsightsGeneratorService {
  private static categoryArMap: Record<string, string> = {
    'Food & Dining': 'مأكولات ومطاعم',
    'Groceries': 'بقالة وسوبرماركت',
    'Shopping': 'تسوق وتجزئة',
    'Transportation': 'مواصلات ونقل',
    'Housing & Rent': 'السكن والإيجار',
    'Utilities & Bills': 'فواتير وخدمات',
    'Healthcare': 'رعاية صحية وصيدليات',
    'Entertainment & Subscriptions': 'ترفيه واشتراكات',
    'Travel': 'سفر وطيران',
    'Education': 'تعليم ودراسة',
    'Fuel & Automotive': 'وقود وصيانة سيارات',
    'Salary & Income': 'رواتب ودخل رئيسي',
    'Freelance Income': 'دخل العمل الحر',
    'Bank Interest': 'فوائد بنكية',
    'Transfers': 'تحويلات داخلية',
    'Debt Payments': 'سداد ديون وبطاقات',
    'Other': 'أخرى'
  };

  /**
   * Generates both English and Arabic financial insights.
   */
  static async generateBilingualInsights(
    overall: OverallSummary,
    spending: SpendingAnalysis,
    income: IncomeAnalysis,
    accounts: AccountSummary[],
    currency: string
  ): Promise<BilingualInsights> {
    const enInsights = await this.generateInsights(overall, spending, income, accounts, currency);
    const arInsights = this.generateHeuristicInsightsAr(overall, spending, income, accounts, currency);

    return {
      en: enInsights,
      ar: arInsights
    };
  }

  /**
   * Generates AI financial insights with a reliable fallback to analytical heuristics.
   */
  static async generateInsights(
    overall: OverallSummary,
    spending: SpendingAnalysis,
    income: IncomeAnalysis,
    accounts: AccountSummary[],
    currency: string
  ): Promise<string[]> {
    // 1. If OpenRouter is configured, try calling it
    if (OpenRouterService.isConfigured()) {
      const metricsContext = {
        currency,
        overallSummary: overall,
        highestSpendingCategory: spending.highestCategory,
        top5Categories: spending.categoryBreakdown.slice(0, 5),
        averageExpense: spending.averageExpense,
        topRecurringExpenses: spending.recurringExpenses.slice(0, 5),
        incomeBreakdown: {
          salary: income.totalSalary,
          freelance: income.totalFreelance,
          interest: income.totalInterest,
          other: income.otherIncome
        },
        creditCardLiability: overall.creditCardEndingLiability,
        reconciledAccounts: accounts.map((a) => ({
          account: a.accountName,
          reconciled: a.reconciled,
          endingBalance: a.endingBalance
        }))
      };

      const aiInsights = await OpenRouterService.generateInsights(metricsContext);
      if (aiInsights && aiInsights.length > 0) {
        return aiInsights;
      }
    }

    // 2. Data-driven heuristic insights fallback (English)
    return this.generateHeuristicInsights(overall, spending, income, accounts, currency);
  }

  /**
   * Generates English insights deterministically.
   */
  private static generateHeuristicInsights(
    overall: OverallSummary,
    spending: SpendingAnalysis,
    income: IncomeAnalysis,
    accounts: AccountSummary[],
    currency: string
  ): string[] {
    const insights: string[] = [];

    // Observation 1: Cash Flow & Savings Rate
    const savingsRate =
      overall.totalIncome > 0
        ? Math.round((overall.netCashFlow / overall.totalIncome) * 100)
        : 0;
    if (overall.netCashFlow > 0) {
      insights.push(
        `Observation: Strong positive net cash flow of ${currency} ${overall.netCashFlow.toLocaleString()} achieved across the statement period, representing an approximate ${savingsRate}% net savings rate.`
      );
    } else {
      insights.push(
        `Observation: Negative cash flow of ${currency} ${Math.abs(overall.netCashFlow).toLocaleString()} detected over the statement period.`
      );
    }

    // Observation 2: Top Spending Category
    if (spending.highestCategory) {
      const topCat = spending.categoryBreakdown[0];
      const pct = topCat ? topCat.percentage : 0;
      insights.push(
        `Observation: "${spending.highestCategory.category}" represents the single largest expenditure category at ${currency} ${spending.highestCategory.amount.toLocaleString()} (${pct}% of all spending).`
      );
    }

    // Observation 3: Income Diversification
    const totalInc = overall.totalIncome;
    if (totalInc > 0 && income.totalFreelance > 0) {
      const freelancePct = Math.round((income.totalFreelance / totalInc) * 100);
      insights.push(
        `Observation: Income is diversified with ${freelancePct}% (${currency} ${income.totalFreelance.toLocaleString()}) originating from freelance/contracting work and ${(100 - freelancePct)}% (${currency} ${income.totalSalary.toLocaleString()}) from primary salary.`
      );
    }

    // Observation 4: Recurring Monthly Obligations
    if (spending.recurringExpenses.length > 0) {
      const topRecurring = spending.recurringExpenses.slice(0, 3);
      const recurringList = topRecurring.map((r) => `${r.description} (~${currency} ${r.avgAmount.toLocaleString()}/mo)`).join(', ');
      insights.push(
        `Observation: Major recurring monthly commitments include ${recurringList}.`
      );
    }

    // Observation 5: Credit Card Utilization & Interest
    if (overall.totalInterestCharged > 0) {
      insights.push(
        `Observation: A total of ${currency} ${overall.totalInterestCharged.toLocaleString()} was charged in credit card purchase interest over the statement period.`
      );
      insights.push(
        `Recommendation: Consider clearing credit card balances before the monthly billing cycle to eliminate interest charges, currently totaling ${currency} ${overall.totalInterestCharged.toLocaleString()}.`
      );
    } else {
      insights.push(
        `Observation: Credit card payments totaled ${currency} ${overall.totalCreditCardPayments.toLocaleString()} with zero finance charges, demonstrating prompt autopay settlements.`
      );
    }

    // Observation 6: Account Balances & Reconciliation
    const allReconciled = accounts.every((a) => a.reconciled);
    if (allReconciled) {
      insights.push(
        `Observation: All accounts (Current, Savings, Credit Card) have been 100% mathematically reconciled against the statement ending summaries.`
      );
    }

    return insights;
  }

  /**
   * Generates Arabic insights deterministically with professional financial terminology.
   */
  private static generateHeuristicInsightsAr(
    overall: OverallSummary,
    spending: SpendingAnalysis,
    income: IncomeAnalysis,
    accounts: AccountSummary[],
    currency: string
  ): string[] {
    const insightsAr: string[] = [];

    const currencyArMap: Record<string, string> = {
      EGP: 'ج.م',
      LE: 'ج.م',
      'L.E.': 'ج.م',
      USD: 'دولار',
      QAR: 'ر.ق',
      EUR: 'يورو',
      AED: 'د.إ',
      SAR: 'ر.س',
      GBP: 'ج.إ'
    };
    const currAr = currencyArMap[(currency || 'EGP').trim().toUpperCase()] || currency;

    // Observation 1: Cash Flow & Savings Rate
    const savingsRate =
      overall.totalIncome > 0
        ? Math.round((overall.netCashFlow / overall.totalIncome) * 100)
        : 0;
    if (overall.netCashFlow > 0) {
      insightsAr.push(
        `ملاحظة: تم تحقيق صافي تدفق نقدي إيجابي قوي قدره ${overall.netCashFlow.toLocaleString()} ${currAr} طوال فترة كشف الحساب، وهو ما يمثل معدل ادخار تقريبي يبلغ ${savingsRate}%.`
      );
    } else {
      insightsAr.push(
        `ملاحظة: تم رصد تدفق نقدي سالب قدره ${Math.abs(overall.netCashFlow).toLocaleString()} ${currAr} خلال فترة كشف الحساب.`
      );
    }

    // Observation 2: Top Spending Category
    if (spending.highestCategory) {
      const topCat = spending.categoryBreakdown[0];
      const pct = topCat ? topCat.percentage : 0;
      const catAr = this.categoryArMap[spending.highestCategory.category] || spending.highestCategory.category;
      insightsAr.push(
        `ملاحظة: فئة "${catAr}" تمثل الفئة الأكبر منفردة من حيث حجم الإنفاق بقيمة ${spending.highestCategory.amount.toLocaleString()} ${currAr} (${pct}% من إجمالي النفقات).`
      );
    }

    // Observation 3: Income Diversification
    const totalInc = overall.totalIncome;
    if (totalInc > 0 && income.totalFreelance > 0) {
      const freelancePct = Math.round((income.totalFreelance / totalInc) * 100);
      insightsAr.push(
        `ملاحظة: مصادر الدخل متنوعة حيث تشكل أعمال العمل الحر والتعاقدات ${freelancePct}% (${income.totalFreelance.toLocaleString()} ${currAr}) بينما يشكل الراتب الأساسي ${(100 - freelancePct)}% (${income.totalSalary.toLocaleString()} ${currAr}).`
      );
    }

    // Observation 4: Recurring Monthly Obligations
    if (spending.recurringExpenses.length > 0) {
      const topRecurring = spending.recurringExpenses.slice(0, 3);
      const recurringList = topRecurring.map((r) => `${r.description} (~${r.avgAmount.toLocaleString()} ${currAr}/شهر)`).join('، ');
      insightsAr.push(
        `ملاحظة: تشمل الالتزامات الشهرية الدورية الرئيسية ${recurringList}.`
      );
    }

    // Observation 5: Credit Card Utilization & Interest
    if (overall.totalInterestCharged > 0) {
      insightsAr.push(
        `ملاحظة: تم احتساب فوائد شراء على البطاقة الائتمانية بإجمالي ${overall.totalInterestCharged.toLocaleString()} ${currAr} خلال فترة كشف الحساب.`
      );
      insightsAr.push(
        `توصية: يُنصح بسداد أرصدة البطاقة الائتمانية قبل نهاية دورة الفوترة الشهرية لتفادي رسوم الفوائد البالغة حالياً ${overall.totalInterestCharged.toLocaleString()} ${currAr}.`
      );
    } else {
      insightsAr.push(
        `ملاحظة: بلغ إجمالي مدفوعات البطاقة الائتمانية ${overall.totalCreditCardPayments.toLocaleString()} ${currAr} دون أي رسوم تمويل، مما يعكس انتظام عمليات السداد التلقائي.`
      );
    }

    // Observation 6: Account Balances & Reconciliation
    const allReconciled = accounts.every((a) => a.reconciled);
    if (allReconciled) {
      insightsAr.push(
        `ملاحظة: تمت مطابقة أرصدة جميع الحسابات (الجاري، التوفير، البطاقة الائتمانية) حسابياً بنسبة 100% مع ملخصات نهاية الكشف.`
      );
    }

    return insightsAr;
  }
}
