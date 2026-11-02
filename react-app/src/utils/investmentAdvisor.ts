import type { FinancialReport } from '../types';

export interface StrategyTier {
  id: 'conservative' | 'balanced' | 'growth';
  annualRate: number; // e.g. 0.05 for 5%
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  color: string;
  riskEn: string;
  riskAr: string;
}

export interface YearProjection {
  year: number;
  cashHold: number;
  conservative: number;
  balanced: number;
  growth: number;
}

export interface InvestmentPlatform {
  id: string;
  name: string;
  taglineEn: string;
  taglineAr: string;
  bestForEn: string;
  bestForAr: string;
  expectedYieldEn: string;
  expectedYieldAr: string;
  badgesEn: string[];
  badgesAr: string[];
  appType: 'trading' | 'funds' | 'treasury' | 'gold';
  actionUrl: string;
}

/**
 * Returns strategy return rates tailored to statement currency.
 * For EGP: rates account for local high-yield certificates / local inflation dynamics.
 * For USD/EUR: rates reflect standard global capital market benchmarks.
 */
export function getStrategyTiers(currency: string): StrategyTier[] {
  const isEgp = currency.toUpperCase() === 'EGP';

  return [
    {
      id: 'conservative',
      annualRate: isEgp ? 0.20 : 0.052, // 20% EGP T-Bills/CDs, 5.2% USD High-Yield Cash
      nameEn: 'Conservative (Treasury & CDs)',
      nameAr: 'محافظ (أذون خزانة وشهادات ادخار)',
      descEn: 'Government-backed certificates, money market funds, and fixed deposits.',
      descAr: 'شهادات بنكية مضمونة، أذون خزانة حكومية، وصناديق سيولة نقدية منخفضة المخاطر.',
      color: '#10b981',
      riskEn: 'Very Low Risk',
      riskAr: 'مخاطر منخفضة جداً'
    },
    {
      id: 'balanced',
      annualRate: isEgp ? 0.24 : 0.11, // 24% EGX30/Mutual funds, 11% S&P 500 Historical CAGR
      nameEn: 'Balanced (Index Funds & ETFs)',
      nameAr: 'متوازن (صناديق مؤشرات واستثمار)',
      descEn: 'Broad-market index funds (S&P 500, EGX30), dividend blue-chips, and gold.',
      descAr: 'صناديق المؤشرات الرئيسية والأسهم القيادية وتوزيعات الأرباح وصناديق الذهب.',
      color: '#3b82f6',
      riskEn: 'Moderate Risk',
      riskAr: 'مخاطر معتدلة'
    },
    {
      id: 'growth',
      annualRate: isEgp ? 0.32 : 0.18, // 32% active growth EGX, 18% US Tech/Active trading
      nameEn: 'Active Trading & Growth Equities',
      nameAr: 'تداول نشط وأسهم نمو',
      descEn: 'High-growth tech equities, swing trading, and momentum breakout strategies.',
      descAr: 'أسهم قطاع التكنولوجيا والنمو السريع، استراتيجيات التداول النشط والفرص السوقية.',
      color: '#8b5cf6',
      riskEn: 'Higher Risk / Active',
      riskAr: 'مخاطر أعلى / نمو نشط'
    }
  ];
}

/**
 * Derives initial financial figures from report:
 * 1. Emergency Fund Cushion (3 months of actual expenses).
 * 2. Deployable Idle Cash (Ending balance - Emergency Fund).
 * 3. Monthly Investable Surplus (Net monthly flow * 70%).
 */
export function deriveCapitalAllocation(report: FinancialReport) {
  const totalExpenses = report.overallSummary?.totalExpenses || 0;
  const endingBalance = report.accounts.reduce(
    (sum, acc) => sum + (acc.endingBalance > 0 ? acc.endingBalance : 0),
    0
  );

  // Estimate monthly expenses
  const monthsCount = Math.max(1, report.monthlyCashFlow.length);
  const monthlyAvgExpense = totalExpenses / monthsCount;

  // Reserve 3 months as emergency cushion
  const emergencyReserve = Math.round(monthlyAvgExpense * 3);

  // Deployable lump sum cash
  const deployableCash = Math.max(0, Math.round(endingBalance - emergencyReserve));

  // Monthly surplus
  const netMonthlyCashFlow = (report.overallSummary?.netCashFlow || 0) / monthsCount;
  const suggestedMonthly = Math.max(0, Math.round(netMonthlyCashFlow * 0.7));

  return {
    endingBalance,
    emergencyReserve,
    deployableCash,
    suggestedMonthly: suggestedMonthly > 0 ? suggestedMonthly : Math.round(monthlyAvgExpense * 0.15),
    monthlyAvgExpense
  };
}

/**
 * Calculates compound future value month-by-month over a given period of years.
 */
export function calculateProjections(
  initialLumpSum: number,
  monthlyContribution: number,
  years: number,
  currency: string
): YearProjection[] {
  const tiers = getStrategyTiers(currency);
  const conservativeRate = tiers.find((t) => t.id === 'conservative')?.annualRate || 0.05;
  const balancedRate = tiers.find((t) => t.id === 'balanced')?.annualRate || 0.11;
  const growthRate = tiers.find((t) => t.id === 'growth')?.annualRate || 0.18;

  const results: YearProjection[] = [];

  for (let y = 0; y <= years; y++) {
    if (y === 0) {
      results.push({
        year: 0,
        cashHold: Math.round(initialLumpSum),
        conservative: Math.round(initialLumpSum),
        balanced: Math.round(initialLumpSum),
        growth: Math.round(initialLumpSum)
      });
      continue;
    }

    const months = y * 12;

    // Cash Hold (0% interest)
    const cashTotal = initialLumpSum + monthlyContribution * months;

    // Compound Growth formula with monthly additions:
    const calcFutureVal = (annualRate: number) => {
      const monthlyRate = annualRate / 12;
      let val = initialLumpSum;
      for (let m = 0; m < months; m++) {
        val = val * (1 + monthlyRate) + monthlyContribution;
      }
      return Math.round(val);
    };

    results.push({
      year: y,
      cashHold: Math.round(cashTotal),
      conservative: calcFutureVal(conservativeRate),
      balanced: calcFutureVal(balancedRate),
      growth: calcFutureVal(growthRate)
    });
  }

  return results;
}

/**
 * Curated list of verified trading platforms & investment vehicles.
 */
export function getRecommendedPlatforms(currency: string): InvestmentPlatform[] {
  const isEgp = currency.toUpperCase() === 'EGP';

  if (isEgp) {
    return [
      {
        id: 'thndr',
        name: 'Thndr (ثندر)',
        taglineEn: 'Top Egyptian Digital Investment & Stock Trading App',
        taglineAr: 'منصة الاستثمار وتداول الأسهم وصناديق الاستثمار الرائدة في مصر',
        bestForEn: 'EGX Stocks, Gold Funds, US Shares & High-Yield Mutual Funds',
        bestForAr: 'الأسهم المصرية وصناديق الذهب والأسهم الأمريكية وصناديق الاستثمار',
        expectedYieldEn: '18% – 26% Expected Annual Return',
        expectedYieldAr: 'عائد سنوي متوقع بين 18% و 26%',
        badgesEn: ['FRA Licensed', 'Zero Commission', 'Instant Fawry/InstaPay'],
        badgesAr: ['مرخص من الهيئة العامة للرقابة المالية', 'صفر عمولة', 'إيداع فوري عبر إنستاباي وفوري'],
        appType: 'trading',
        actionUrl: 'https://thndr.app'
      },
      {
        id: 'azimut-gold',
        name: 'Azimut / Gold Funds (صناديق الذهب والادخار)',
        taglineEn: 'Physical Gold & Fixed Income Sharia-Compliant Funds',
        taglineAr: 'صناديق الاستثمار في الذهب الفعلي وأدوات الدخل الثابت المتوافقة مع الشريعة',
        bestForEn: 'Long-term inflation hedge, wealth preservation & capital safety',
        bestForAr: 'التحوط طويل الأجل ضد التضخم، حماية الثروة، والحفاظ على رأس المال',
        expectedYieldEn: '20% – 30% Gold Historical Growth',
        expectedYieldAr: 'نمو تاريخي بين 20% و 30% للذهب',
        badgesEn: ['Sharia Compliant', 'Physical Gold Backed', 'High Liquidity'],
        badgesAr: ['متوافق مع أحكام الشريعة', 'مدعوم بالذهب الفعلي', 'سهولة التسييل والسحب'],
        appType: 'gold',
        actionUrl: 'https://azimut.eg'
      },
      {
        id: 'treasury-bills',
        name: 'Egyptian Treasury Bills & CDs (أذون وسندات الخزانة)',
        taglineEn: 'Government-Guaranteed High-Yield Fixed Return',
        taglineAr: 'أذون وسندات خزانة حكومية بعوائد قياسية مضمونة بالكامل',
        bestForEn: 'Guaranteed income with fixed periodic coupon payouts',
        bestForAr: 'عائد دوري ثابت ومضمون بالكامل من البنك المركزي المصري',
        expectedYieldEn: '22% – 25% Fixed Net Annual Yield',
        expectedYieldAr: 'عائد سنوي صافٍ يتراوح بين 22% و 25%',
        badgesEn: ['Central Bank Guaranteed', 'Quarterly/Maturity Payout', 'Zero Volatility'],
        badgesAr: ['مضمون من البنك المركزي', 'عائد ربع سنوي أو عند الاستحقاق', 'بدون أي تذبذب'],
        appType: 'treasury',
        actionUrl: '#'
      }
    ];
  }

  // Global / USD defaults
  return [
    {
      id: 'ibkr',
      name: 'Interactive Brokers (IBKR)',
      taglineEn: 'Premier Global Brokerage for Stocks, ETFs & Options',
      taglineAr: 'المنصة العالمية الأولى لتداول الأسهم الأمريكية وصناديق المؤشرات والعقود',
      bestForEn: 'Global diversification, US Stocks, S&P 500 ETFs & deep liquidity',
      bestForAr: 'تنويع المحفظة عالمياً، أسهم وول ستريت، وصناديق S&P 500',
      expectedYieldEn: '10% – 14% S&P 500 Historical CAGR',
      expectedYieldAr: 'عائد مركب تاريخي 10% إلى 14% سنوياً',
      badgesEn: ['SIPC Insured to $500k', 'Lowest Margin Rates', 'Global Exchanges'],
      badgesAr: ['تأمين SIPC حتى 500 ألف دولار', 'أقل عمولات تمويل', 'الوصول لكافة البورصات العالمية'],
      appType: 'trading',
      actionUrl: 'https://interactivebrokers.com'
    },
    {
      id: 'etf-sp500',
      name: 'Global Index Funds (VOO / SPY / QQQ)',
      taglineEn: 'Automated Wealth Compounding in the Top 500 US Companies',
      taglineAr: 'الاستثمار التلقائي طويل الأجل في أفضل 500 شركة أمريكية وعالمية',
      bestForEn: 'Hands-off compound wealth building with reinvested dividends',
      bestForAr: 'بناء الثروة المتراكمة بدون جهد مع إعادة استثمار توزيعات الأرباح',
      expectedYieldEn: '11.8% 10-Year Annualized Return',
      expectedYieldAr: 'متوسط عائد سنوي 11.8% على مدار 10 سنوات',
      badgesEn: ['Top 500 US Blue-Chips', 'Low Expense Ratio (0.03%)', 'Passive Compounding'],
      badgesAr: ['أكبر 500 شركة عملاقة', 'أقل مصاريف إدارة (0.03%)', 'نمو مركب تلقائي'],
      appType: 'funds',
      actionUrl: '#'
    },
    {
      id: 'us-treasury',
      name: 'US Treasury Bills & High-Yield Cash',
      taglineEn: 'Risk-Free Dollar Yield Backed by US Government',
      taglineAr: 'أذون خزانة أمريكية وعائد دولاري مضمون بأعلى تصنيف ائتماني',
      bestForEn: 'Zero-risk dollar preservation with periodic coupon',
      bestForAr: 'حفظ رأس المال الدولاري بأعلى درجة أمان مع توزيعات دورية',
      expectedYieldEn: '4.8% – 5.3% Fixed USD Annual Yield',
      expectedYieldAr: 'عائد سنوي دولاري ثابت بين 4.8% و 5.3%',
      badgesEn: ['US Government Backed', 'Capital Guaranteed', 'High Liquidity'],
      badgesAr: ['مضمون من الخزانة الأمريكية', 'رأس المال مضمون بالكامل', 'سيولة عالية'],
      appType: 'treasury',
      actionUrl: '#'
    }
  ];
}
