import React from 'react';
import type { OverallSummary } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { MoneyDisplay } from '../common/MoneyDisplay';

interface FinancialSummaryCardsProps {
  summary: OverallSummary;
  currency: string;
}

export const FinancialSummaryCards: React.FC<FinancialSummaryCardsProps> = ({
  summary,
  currency
}) => {
  const { t } = useLanguage();

  return (
    <div className="summary-grid">
      {/* 1. Total Income */}
      <div className="metric-card metric-income">
        <span className="metric-label">{t.totalIncome}</span>
        <span className="metric-value income">
          <MoneyDisplay amount={summary.totalIncome} currency={currency} />
        </span>
        <span className="metric-subtext">{t.incomeSubtext}</span>
      </div>

      {/* 2. Total Actual Expenses */}
      <div className="metric-card metric-expense">
        <span className="metric-label">{t.totalExpenses}</span>
        <span className="metric-value expense">
          <MoneyDisplay amount={summary.totalExpenses} currency={currency} />
        </span>
        <span className="metric-subtext">{t.expensesSubtext}</span>
      </div>

      {/* 3. Net Cash Flow */}
      <div className="metric-card metric-netflow">
        <span className="metric-label">{t.netCashFlow}</span>
        <span
          className={`metric-value ${
            summary.netCashFlow >= 0 ? 'net-positive' : 'net-negative'
          }`}
        >
          <MoneyDisplay amount={summary.netCashFlow} currency={currency} />
        </span>
        <span className="metric-subtext">{t.netCashFlowSubtext}</span>
      </div>

      {/* 4. Transactions Extracted */}
      <div className="metric-card metric-count">
        <span className="metric-label">{t.transactionsExtracted}</span>
        <span className="metric-value">{summary.transactionCount}</span>
        <span className="metric-subtext">{t.transactionsSubtext}</span>
      </div>
    </div>
  );
};
