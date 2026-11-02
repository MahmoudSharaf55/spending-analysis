import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Shield,
  Coins,
  AlertTriangle,
  ExternalLink,
  Sliders,
  Sparkles,
  CheckCircle2,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import type { FinancialReport } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { MoneyDisplay } from '../common/MoneyDisplay';
import {
  deriveCapitalAllocation,
  getStrategyTiers,
  calculateProjections,
  getRecommendedPlatforms
} from '../../utils/investmentAdvisor';

interface InvestmentAdvisorProps {
  report: FinancialReport;
}

export const InvestmentAdvisor: React.FC<InvestmentAdvisorProps> = ({ report }) => {
  const { lang, t } = useLanguage();
  const currency = report.currency;

  const allocation = useMemo(() => deriveCapitalAllocation(report), [report]);
  const strategyTiers = useMemo(() => getStrategyTiers(currency), [currency]);
  const platforms = useMemo(() => getRecommendedPlatforms(currency), [currency]);

  // Interactive Simulator States
  const [lumpSum, setLumpSum] = useState<number>(allocation.deployableCash);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(
    allocation.suggestedMonthly
  );
  const [horizonYears, setHorizonYears] = useState<number>(3);
  const [selectedStrategyId, setSelectedStrategyId] = useState<'conservative' | 'balanced' | 'growth'>('balanced');

  const projections = useMemo(
    () => calculateProjections(lumpSum, monthlyContribution, horizonYears, currency),
    [lumpSum, monthlyContribution, horizonYears, currency]
  );

  const selectedTier = strategyTiers.find((t) => t.id === selectedStrategyId) || strategyTiers[1];

  const currentFinalProjection = projections[projections.length - 1];
  const cashAtEnd = currentFinalProjection ? currentFinalProjection.cashHold : 0;
  const investedAtEnd = currentFinalProjection
    ? currentFinalProjection[selectedStrategyId]
    : 0;
  const netProfit = Math.max(0, investedAtEnd - cashAtEnd);

  // Inflation cost estimate (e.g. 5% USD or 18% EGP annually on lump sum)
  const isEgp = currency.toUpperCase() === 'EGP';
  const inflationAnnualRate = isEgp ? 0.18 : 0.045;
  const inflationCost = Math.round(lumpSum * (1 - Math.pow(1 - inflationAnnualRate, horizonYears)));

  // Slider bounds
  const maxLumpSum = Math.max(allocation.endingBalance, 1000);
  const maxMonthly = Math.max(allocation.suggestedMonthly * 3, 500);

  return (
    <section className="card wealth-advisor-card">
      {/* Header Banner */}
      <div className="wealth-header-banner">
        <div className="wealth-title-wrap">
          <div className="wealth-badge-icon">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="wealth-tag-row">
              <span className="badge badge-purple">
                <Sparkles size={12} /> AI Wealth Intelligence
              </span>
              <span className="badge badge-success">
                <Coins size={12} /> {Math.round(selectedTier.annualRate * 100)}% Est. Annual Return
              </span>
            </div>
            <h2 className="wealth-main-title">{t.wealthAdvisorTitle}</h2>
            <p className="wealth-subtitle">{t.wealthAdvisorSubtitle}</p>
          </div>
        </div>
      </div>

      {/* 4 Hero Metric Cards */}
      <div className="wealth-metrics-grid">
        {/* 1. Deployable Idle Cash */}
        <div className="wealth-metric-card metric-deployable">
          <div className="wealth-metric-header">
            <span className="wealth-metric-label">{t.deployableIdleCash}</span>
            <Coins size={18} className="text-primary" />
          </div>
          <div className="wealth-metric-val">
            <MoneyDisplay amount={allocation.deployableCash} currency={currency} decimals={0} />
          </div>
          <span className="wealth-metric-sub">{t.deployableSubtext}</span>
        </div>

        {/* 2. Emergency Cushion Reserved */}
        <div className="wealth-metric-card metric-emergency">
          <div className="wealth-metric-header">
            <span className="wealth-metric-label">{t.emergencyFundReserve}</span>
            <Shield size={18} className="text-success" />
          </div>
          <div className="wealth-metric-val">
            <MoneyDisplay amount={allocation.emergencyReserve} currency={currency} decimals={0} />
          </div>
          <span className="wealth-metric-sub">{t.emergencyFundSubtext}</span>
        </div>

        {/* 3. Potential Extra Revenue */}
        <div className="wealth-metric-card metric-profit">
          <div className="wealth-metric-header">
            <span className="wealth-metric-label">{t.projectedExtraRevenue}</span>
            <TrendingUp size={18} className="text-success" />
          </div>
          <div className="wealth-metric-val text-success">
            <MoneyDisplay amount={netProfit} currency={currency} sign="+" decimals={0} />
          </div>
          <span className="wealth-metric-sub">
            {t.projectedRevenueSubtext} ({horizonYears} {lang === 'ar' ? 'سنوات' : 'years'})
          </span>
        </div>

        {/* 4. Cost of Cash Inaction */}
        <div className="wealth-metric-card metric-inaction">
          <div className="wealth-metric-header">
            <span className="wealth-metric-label">{t.costOfInaction}</span>
            <AlertTriangle size={18} className="text-danger" />
          </div>
          <div className="wealth-metric-val text-danger">
            <MoneyDisplay amount={inflationCost} currency={currency} sign="-" decimals={0} />
          </div>
          <span className="wealth-metric-sub">{t.costOfInactionSubtext}</span>
        </div>
      </div>

      {/* Interactive Simulator Section */}
      <div className="simulator-container">
        <div className="simulator-header">
          <div className="simulator-title-group">
            <Sliders size={18} className="text-primary" />
            <h3 className="simulator-title">{t.investmentSimulatorTitle}</h3>
          </div>
          <div className="horizon-pills">
            <span className="horizon-label">{t.timeHorizonLabel}:</span>
            {[1, 3, 5, 10].map((y) => (
              <button
                key={y}
                type="button"
                className={`horizon-btn ${horizonYears === y ? 'active' : ''}`}
                onClick={() => setHorizonYears(y)}
              >
                {y} {lang === 'ar' ? (y === 1 ? 'سنة' : 'سنوات') : y === 1 ? 'Yr' : 'Yrs'}
              </button>
            ))}
          </div>
        </div>

        <div className="simulator-body-layout">
          {/* Controls Column */}
          <div className="simulator-controls-col">
            {/* Slider 1: Initial Lump Sum */}
            <div className="slider-group">
              <div className="slider-header-row">
                <label className="slider-label">{t.lumpSumSliderLabel}</label>
                <span className="slider-val-badge">
                  <MoneyDisplay amount={lumpSum} currency={currency} decimals={0} />
                </span>
              </div>
              <input
                type="range"
                className="wealth-range-slider"
                min={0}
                max={maxLumpSum}
                step={Math.max(100, Math.round(maxLumpSum / 100))}
                value={lumpSum}
                onChange={(e) => setLumpSum(Number(e.target.value))}
              />
              <div className="slider-scale-limits">
                <span>0</span>
                <span>
                  <MoneyDisplay amount={maxLumpSum} currency={currency} decimals={0} />
                </span>
              </div>
            </div>

            {/* Slider 2: Monthly Deposit */}
            <div className="slider-group">
              <div className="slider-header-row">
                <label className="slider-label">{t.monthlyDepositLabel}</label>
                <span className="slider-val-badge">
                  <MoneyDisplay amount={monthlyContribution} currency={currency} decimals={0} /> / {lang === 'ar' ? 'شهر' : 'mo'}
                </span>
              </div>
              <input
                type="range"
                className="wealth-range-slider"
                min={0}
                max={maxMonthly}
                step={Math.max(50, Math.round(maxMonthly / 100))}
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              />
              <div className="slider-scale-limits">
                <span>0</span>
                <span>
                  <MoneyDisplay amount={maxMonthly} currency={currency} decimals={0} />
                </span>
              </div>
            </div>

            {/* Strategy Tiers Selection */}
            <div className="strategy-selector-group">
              <label className="slider-label">{t.strategySelection}</label>
              <div className="strategy-options-list">
                {strategyTiers.map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    className={`strategy-card-btn ${selectedStrategyId === tier.id ? 'active' : ''}`}
                    onClick={() => setSelectedStrategyId(tier.id)}
                    style={
                      selectedStrategyId === tier.id
                        ? { borderColor: tier.color, backgroundColor: `${tier.color}15` }
                        : {}
                    }
                  >
                    <div className="strategy-btn-header">
                      <span className="strategy-btn-name">
                        {lang === 'ar' ? tier.nameAr : tier.nameEn}
                      </span>
                      <span className="strategy-rate-tag" style={{ color: tier.color }}>
                        {Math.round(tier.annualRate * 100)}% / yr
                      </span>
                    </div>
                    <p className="strategy-btn-desc">
                      {lang === 'ar' ? tier.descAr : tier.descEn}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Projection Chart Column */}
          <div className="simulator-chart-col">
            <div className="chart-projection-highlight">
              <div className="highlight-pill">
                <span>{lang === 'ar' ? 'القيمة المتوقعة بعد' : 'Projected Value in'} {horizonYears} {lang === 'ar' ? 'سنوات' : 'years'}:</span>
                <strong className="highlight-amount">
                  <MoneyDisplay amount={investedAtEnd} currency={currency} decimals={0} />
                </strong>
                <span className="highlight-profit text-success">
                  (+<MoneyDisplay amount={netProfit} currency={currency} decimals={0} /> {lang === 'ar' ? 'أرباح صافية' : 'gain'})
                </span>
              </div>
            </div>

            <div className="recharts-wrapper-container" style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={projections}
                  margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="balancedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="conservativeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="year"
                    tickFormatter={(val) =>
                      val === 0 ? (lang === 'ar' ? 'اليوم' : 'Start') : `${val} ${lang === 'ar' ? 'سنة' : 'Yr'}`
                    }
                    stroke="var(--text-muted)"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickFormatter={(val) =>
                      val >= 1000000
                        ? `${(val / 1000000).toFixed(1)}M`
                        : val >= 1000
                        ? `${Math.round(val / 1000)}k`
                        : `${val}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow-md)',
                      fontSize: '0.8rem'
                    }}
                    formatter={(value: any, name: any) => [
                      `${Number(value).toLocaleString()} ${currency}`,
                      name === 'growth'
                        ? lang === 'ar' ? 'تداول نشط ونمو' : 'Active Growth'
                        : name === 'balanced'
                        ? lang === 'ar' ? 'صناديق مؤشرات واستثمار' : 'Index Funds & ETFs'
                        : name === 'conservative'
                        ? lang === 'ar' ? 'شهادات وأذون خزانة' : 'Fixed Income / CDs'
                        : lang === 'ar' ? 'كاش راكد (0%)' : 'Holding Cash'
                    ]}
                    labelFormatter={(label) =>
                      `${lang === 'ar' ? 'السنة' : 'Year'} ${label}`
                    }
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(val) => (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {val === 'growth'
                          ? lang === 'ar' ? 'تداول نشط ونمو (32%)' : 'Active Growth (18%)'
                          : val === 'balanced'
                          ? lang === 'ar' ? 'صناديق مؤشرات واستثمار (24%)' : 'Index Funds / ETFs (11%)'
                          : val === 'conservative'
                          ? lang === 'ar' ? 'شهادات وأذون خزانة (20%)' : 'Fixed Income / CDs (5.2%)'
                          : lang === 'ar' ? 'كاش راكد (0%)' : 'Holding Cash (0%)'}
                      </span>
                    )}
                  />

                  {/* Cash Baseline (No Growth) */}
                  <Area
                    type="monotone"
                    dataKey="cashHold"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    fill="transparent"
                    strokeWidth={1.5}
                  />

                  {/* Active Strategy curves */}
                  {selectedStrategyId === 'conservative' && (
                    <Area
                      type="monotone"
                      dataKey="conservative"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fill="url(#conservativeGrad)"
                    />
                  )}
                  {selectedStrategyId === 'balanced' && (
                    <Area
                      type="monotone"
                      dataKey="balanced"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fill="url(#balancedGrad)"
                    />
                  )}
                  {selectedStrategyId === 'growth' && (
                    <Area
                      type="monotone"
                      dataKey="growth"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      fill="url(#growthGrad)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Curated Trading & Wealth Platforms Section */}
      <div className="platforms-section">
        <div className="platforms-header">
          <h3 className="platforms-title">{t.recommendedPlatformsTitle}</h3>
          <p className="platforms-subtitle">{t.recommendedPlatformsSubtitle}</p>
        </div>

        <div className="platforms-grid">
          {platforms.map((app) => (
            <div key={app.id} className="platform-card">
              <div className="platform-top-row">
                <span className="platform-name">{app.name}</span>
                <span className="platform-yield-tag">
                  {lang === 'ar' ? app.expectedYieldAr : app.expectedYieldEn}
                </span>
              </div>
              <p className="platform-tagline">
                {lang === 'ar' ? app.taglineAr : app.taglineEn}
              </p>

              <div className="platform-best-for">
                <span className="best-for-label">{lang === 'ar' ? 'الأنسب لـ:' : 'Best For:'}</span>
                <span className="best-for-text">
                  {lang === 'ar' ? app.bestForAr : app.bestForEn}
                </span>
              </div>

              <div className="platform-badges-list">
                {(lang === 'ar' ? app.badgesAr : app.badgesEn).map((badge, bIdx) => (
                  <span key={bIdx} className="platform-badge-pill">
                    <CheckCircle2 size={11} className="badge-check-icon" />
                    <span>{badge}</span>
                  </span>
                ))}
              </div>

              {app.actionUrl && app.actionUrl !== '#' && (
                <a
                  href={app.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm platform-cta-btn"
                >
                  <span>{t.explorePlatform}</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Regulatory & Risk Disclaimer */}
      <div className="wealth-disclaimer-box">
        <Info size={16} className="disclaimer-icon" />
        <div>
          <strong className="disclaimer-title">{t.disclaimerTitle}:</strong>{' '}
          <span className="disclaimer-text">{t.disclaimerText}</span>
        </div>
      </div>
    </section>
  );
};
