import React, { useState, useMemo, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { useStatementAnalyzer } from './hooks/useStatementAnalyzer';
import { Header } from './components/common/Header';
import { UploadSection } from './components/upload/UploadSection';
import { FinancialSummaryCards } from './components/summary/FinancialSummaryCards';
import { SecondaryMetrics } from './components/summary/SecondaryMetrics';
import { AccountBreakdown } from './components/accounts/AccountBreakdown';
import { DateRangeFilter } from './components/common/DateRangeFilter';
import { SpendingCharts } from './components/charts/SpendingCharts';
import { FinancialInsights } from './components/insights/FinancialInsights';
import { TransactionsTable } from './components/transactions/TransactionsTable';
import { computeFilteredAnalytics } from './utils/analytics';

const DashboardContent: React.FC = () => {
  const {
    report,
    loading,
    error,
    openRouterStatus,
    analyzeFile,
    reset
  } = useStatementAnalyzer();

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Reset date range filter when a new statement is analyzed or reset
  useEffect(() => {
    setStartDate('');
    setEndDate('');
  }, [report]);

  // Filter transactions by date range
  const dateFilteredTransactions = useMemo(() => {
    if (!report) return [];
    return report.transactions.filter((tx) => {
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;
      return true;
    });
  }, [report, startDate, endDate]);

  // Compute derived dynamic analytics for the charts based on the active date range
  const isDateFiltered = Boolean(startDate || endDate);

  const derivedAnalytics = useMemo(() => {
    if (!report) return null;
    if (!isDateFiltered) {
      return {
        spending: report.spendingAnalysis,
        monthlyCashFlow: report.monthlyCashFlow
      };
    }
    return computeFilteredAnalytics(dateFilteredTransactions);
  }, [report, isDateFiltered, dateFilteredTransactions]);

  const handleResetDateRange = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="dashboard-container">
      {/* App Header with Dark Mode & Language Toggles */}
      <Header report={report} openRouterStatus={openRouterStatus} />

      {/* Upload & Reset Section */}
      <UploadSection
        loading={loading}
        error={error}
        hasReport={!!report}
        onAnalyzeFile={analyzeFile}
        onReset={reset}
      />

      {/* Main Analysis Results */}
      {report && (
        <>
          {/* Section B: Financial Summary & Secondary Metrics */}
          <section>
            <FinancialSummaryCards
              summary={report.overallSummary}
              currency={report.currency}
            />
            <SecondaryMetrics
              summary={report.overallSummary}
              currency={report.currency}
            />
          </section>

          {/* Section D: Account Breakdown & Balance Reconciliation */}
          <AccountBreakdown accounts={report.accounts} />

          {/* Date Range Filter for Charts & Transactions */}
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            minDate={report.statementPeriod.start}
            maxDate={report.statementPeriod.end}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onResetDateRange={handleResetDateRange}
            filteredCount={dateFilteredTransactions.length}
            totalCount={report.transactions.length}
          />

          {/* Section C: Spending, Trend, & Cash Flow Charts (Date-filtered) */}
          {derivedAnalytics && (
            <SpendingCharts
              spending={derivedAnalytics.spending}
              monthlyCashFlow={derivedAnalytics.monthlyCashFlow}
              currency={report.currency}
            />
          )}

          {/* Section F: AI Financial Insights & Observations */}
          <FinancialInsights
            insights={report.insights}
            insightsAr={report.insightsAr}
          />

          {/* Section E: Transactions Table with Filtering, Pagination, & Footers (Date-filtered) */}
          <TransactionsTable
            transactions={dateFilteredTransactions}
            currency={report.currency}
          />
        </>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <DashboardContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}
