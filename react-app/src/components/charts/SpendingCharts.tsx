import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import type { SpendingAnalysis, MonthlyCashFlow } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { translateCategory } from '../../i18n';
import { formatMoneyString } from '../../utils/currency';
import { CATEGORY_COLORS } from '../../utils/constants';

interface SpendingChartsProps {
  spending: SpendingAnalysis;
  monthlyCashFlow: MonthlyCashFlow[];
  currency: string;
}

export const SpendingCharts: React.FC<SpendingChartsProps> = ({
  spending,
  monthlyCashFlow,
  currency
}) => {
  const { lang, isRtl, t } = useLanguage();
  const { isDark } = useTheme();

  // Dynamic theme colors for Recharts SVG elements
  const gridStroke = isDark ? '#334155' : '#e2e8f0';
  const axisTextFill = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
  const tooltipColor = isDark ? '#f8fafc' : '#0f172a';

  const localizedCategoryData = useMemo(() => {
    return spending.categoryBreakdown.map((item) => ({
      ...item,
      localizedName: translateCategory(item.category, lang)
    }));
  }, [spending.categoryBreakdown, lang]);

  const tooltipContentStyle: React.CSSProperties = {
    backgroundColor: tooltipBg,
    borderColor: tooltipBorder,
    color: tooltipColor,
    direction: isRtl ? 'rtl' : 'ltr',
    textAlign: isRtl ? 'right' : 'left',
    borderRadius: '8px',
    boxShadow: isDark
      ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
      : '0 4px 12px rgba(0, 0, 0, 0.08)',
    fontSize: '0.8rem',
    padding: '8px 12px'
  };

  return (
    <section className="charts-grid charts-grid-2">
      {/* Chart 1: Spending by Category (Clean Donut) */}
      <div className="card">
        <h3 className="card-title-text">{t.spendingByCategory}</h3>
        <div className="chart-wrapper" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={localizedCategoryData}
                dataKey="amount"
                nameKey="localizedName"
                cx="50%"
                cy="44%"
                outerRadius={75}
                innerRadius={42}
                paddingAngle={2}
              >
                {localizedCategoryData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    stroke={isDark ? '#1e293b' : '#ffffff'}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [
                  formatMoneyString(Number(value), currency, lang),
                  t.chartSpending
                ]}
                contentStyle={tooltipContentStyle}
              />
              <Legend
                verticalAlign="bottom"
                height={46}
                wrapperStyle={{
                  fontSize: '0.72rem',
                  direction: isRtl ? 'rtl' : 'ltr',
                  paddingTop: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Monthly Spending Trend (Bar Chart) */}
      <div className="card">
        <h3 className="card-title-text">{t.monthlySpendingTrend}</h3>
        <div className="chart-wrapper" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={spending.monthlySpending}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis
                dataKey="month"
                tickFormatter={(m) => m.substring(5)}
                fontSize={11}
                tickLine={false}
                stroke={axisTextFill}
              />
              <YAxis
                fontSize={11}
                tickLine={false}
                stroke={axisTextFill}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val: any) => [
                  formatMoneyString(Number(val), currency, lang),
                  t.chartMonthlyExpenses
                ]}
                contentStyle={tooltipContentStyle}
              />
              <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Monthly Income vs Expenses (Line Chart) */}
      <div className="card chart-span-all">
        <h3 className="card-title-text">{t.monthlyCashFlow}</h3>
        <div className="chart-wrapper" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyCashFlow}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis dataKey="month" fontSize={11} tickLine={false} stroke={axisTextFill} />
              <YAxis
                fontSize={11}
                tickLine={false}
                stroke={axisTextFill}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val: any, name: any) => [
                  formatMoneyString(Number(val), currency, lang),
                  name === 'income'
                    ? t.chartIncome
                    : name === 'expenses'
                    ? t.chartExpenses
                    : t.chartNetFlow
                ]}
                contentStyle={tooltipContentStyle}
              />
              <Legend
                wrapperStyle={{
                  fontSize: '0.75rem',
                  direction: isRtl ? 'rtl' : 'ltr'
                }}
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#16a34a"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#16a34a' }}
                name={t.chartIncome}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#dc2626"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#dc2626' }}
                name={t.chartExpenses}
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="#2563eb"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#2563eb' }}
                name={t.chartNetFlow}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};
