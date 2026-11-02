import React from 'react';
import { Printer, Download, X, ShieldCheck, TrendingUp, TrendingDown, DollarSign, PieChart, FileText } from 'lucide-react';
import type { FinancialReport } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { MoneyDisplay } from '../common/MoneyDisplay';
import { exportExecutiveSummaryToCSV } from '../../utils/export';
import { deriveCapitalAllocation } from '../../utils/investmentAdvisor';

interface ExecutiveReportModalProps {
  report: FinancialReport;
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  report,
  isOpen,
  onClose
}) => {
  const { lang, t, isRtl } = useLanguage();

  if (!isOpen || !report) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSummaryCsv = () => {
    exportExecutiveSummaryToCSV(report, lang);
  };

  const totalIncome = report.overallSummary?.totalIncome || 0;
  const totalExpenses = report.overallSummary?.totalExpenses || 0;
  const netCashFlow = report.overallSummary?.netCashFlow || (totalIncome - totalExpenses);
  const savingsRate =
    totalIncome > 0
      ? ((totalIncome - totalExpenses) / totalIncome) * 100
      : 0;
  const burnRate = report.spendingAnalysis?.averageExpense || 0;

  const allocation = deriveCapitalAllocation(report);
  const isEgp = report.currency.toUpperCase() === 'EGP';
  const potential3YrConservative = Math.round(
    allocation.deployableCash * Math.pow(1 + (isEgp ? 0.20 : 0.052), 3) - allocation.deployableCash
  );
  const potential3YrBalanced = Math.round(
    allocation.deployableCash * Math.pow(1 + (isEgp ? 0.24 : 0.11), 3) - allocation.deployableCash
  );

  const insightsList: string[] =
    lang === 'ar' && report.insightsAr && report.insightsAr.length > 0
      ? report.insightsAr
      : report.insights || [];

  const currentDateFormatted = new Date().toLocaleDateString(
    lang === 'ar' ? 'ar-EG' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  );

  const categories = report.spendingAnalysis?.categoryBreakdown || [];
  const accounts = report.accounts || [];

  return (
    <div className="report-modal-overlay">
      <div className="report-modal-dialog">
        {/* Modal Controls Header - Hidden on Print */}
        <div className="report-modal-actions no-print">
          <div className="report-actions-left">
            <span className="report-modal-tag">
              <FileText size={16} />
              {t.executiveReportTitle}
            </span>
          </div>
          <div className="report-actions-right">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleDownloadSummaryCsv}
              title={t.downloadCsv}
            >
              <Download size={15} />
              <span>{t.downloadCsv}</span>
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handlePrint}
              title={t.printPdf}
            >
              <Printer size={15} />
              <span>{t.printPdf}</span>
            </button>
            <button
              type="button"
              className="btn-icon report-close-btn"
              onClick={onClose}
              title={t.close}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Executive Report Content */}
        <div id="executive-printable-report" className="executive-report-sheet">
          {/* Document Header */}
          <header className="report-doc-header">
            <div className="report-doc-branding">
              <div className="report-bank-badge">
                <ShieldCheck size={28} className="report-bank-icon" />
                <div>
                  <h1 className="report-main-title">{t.executiveReportTitle}</h1>
                  <p className="report-main-subtitle">{t.executiveReportSubtitle}</p>
                </div>
              </div>
              <div className="report-meta-box">
                <div className="report-meta-row">
                  <span className="report-meta-label">{t.statementPeriodLabel}:</span>
                  <span className="report-meta-value">
                    {report.statementPeriod?.start || ''} — {report.statementPeriod?.end || ''}
                  </span>
                </div>
                <div className="report-meta-row">
                  <span className="report-meta-label">{t.reportGeneratedOn}:</span>
                  <span className="report-meta-value">{currentDateFormatted}</span>
                </div>
                {accounts.length > 0 && (
                  <div className="report-meta-row">
                    <span className="report-meta-label">{t.colAccount}:</span>
                    <span className="report-meta-value">
                      {accounts.map((a) => `${a.accountType.toUpperCase()} (${a.accountNumber})`).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="report-confidential-bar">
              {t.confidentialNotice}
            </div>
          </header>

          {/* Section 1: Executive KPI Cards */}
          <section className="report-section">
            <h2 className="report-section-title">{t.executiveSummaryTitle}</h2>
            <div className="report-kpi-grid">
              <div className="report-kpi-card income-kpi">
                <div className="report-kpi-icon-wrap">
                  <TrendingUp size={20} />
                </div>
                <div className="report-kpi-body">
                  <span className="report-kpi-label">{t.totalIncome}</span>
                  <span className="report-kpi-val">
                    <MoneyDisplay
                      amount={totalIncome}
                      currency={report.currency}
                      sign="+"
                      decimals={2}
                    />
                  </span>
                </div>
              </div>

              <div className="report-kpi-card expense-kpi">
                <div className="report-kpi-icon-wrap">
                  <TrendingDown size={20} />
                </div>
                <div className="report-kpi-body">
                  <span className="report-kpi-label">{t.totalExpenses}</span>
                  <span className="report-kpi-val">
                    <MoneyDisplay
                      amount={totalExpenses}
                      currency={report.currency}
                      sign="-"
                      decimals={2}
                    />
                  </span>
                </div>
              </div>

              <div
                className={`report-kpi-card ${
                  netCashFlow >= 0 ? 'net-kpi-positive' : 'net-kpi-negative'
                }`}
              >
                <div className="report-kpi-icon-wrap">
                  <DollarSign size={20} />
                </div>
                <div className="report-kpi-body">
                  <span className="report-kpi-label">{t.netCashFlow}</span>
                  <span className="report-kpi-val">
                    <MoneyDisplay
                      amount={Math.abs(netCashFlow)}
                      currency={report.currency}
                      sign={netCashFlow >= 0 ? '+' : '-'}
                      decimals={2}
                    />
                  </span>
                </div>
              </div>

              <div className="report-kpi-card rate-kpi">
                <div className="report-kpi-icon-wrap">
                  <PieChart size={20} />
                </div>
                <div className="report-kpi-body">
                  <span className="report-kpi-label">{t.savingsRateLabel}</span>
                  <span className="report-kpi-val font-bold">
                    {savingsRate.toFixed(1)}%
                  </span>
                  <span className="report-kpi-sub">
                    {t.burnRateLabel}:{' '}
                    <MoneyDisplay
                      amount={burnRate}
                      currency={report.currency}
                      decimals={0}
                    />
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Account Reconciliation */}
          {accounts.length > 0 && (
            <section className="report-section page-break-inside-avoid">
              <h2 className="report-section-title">{t.accountReconciliationSummary}</h2>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>{t.accountLabel}</th>
                    <th>{t.beginningBalLabel}</th>
                    <th>{t.totalDepositsLabel}</th>
                    <th>{t.totalWithdrawalsLabel}</th>
                    <th>{t.endingBalLabel}</th>
                    <th>{t.summaryReconciliation}</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc) => (
                    <tr key={acc.accountNumber}>
                      <td className="font-semibold">
                        {acc.accountType.toUpperCase()} ({acc.accountNumber})
                      </td>
                      <td>
                        <MoneyDisplay
                          amount={acc.beginningBalance ?? 0}
                          currency={report.currency}
                          decimals={2}
                        />
                      </td>
                      <td className="amount-income">
                        <MoneyDisplay
                          amount={acc.totalDepositsOrCredits ?? 0}
                          currency={report.currency}
                          sign="+"
                          decimals={2}
                        />
                      </td>
                      <td className="amount-expense">
                        <MoneyDisplay
                          amount={acc.totalWithdrawalsOrDebits ?? 0}
                          currency={report.currency}
                          sign="-"
                          decimals={2}
                        />
                      </td>
                      <td className="font-bold">
                        <MoneyDisplay
                          amount={acc.endingBalance ?? 0}
                          currency={report.currency}
                          decimals={2}
                        />
                      </td>
                      <td>
                        <span className="report-badge-reconciled">
                          {acc.reconciled ? t.reconciled100 : t.unreconciled}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Section 2B: Wealth Growth & Idle Capital Potential */}
          {allocation.deployableCash > 0 && (
            <section className="report-section page-break-inside-avoid">
              <h2 className="report-section-title">
                {lang === 'ar'
                  ? 'الفرص الاستثمارية وتنمية السيولة النقدية'
                  : 'Capital Deployment & Wealth Growth Potential'}
              </h2>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>{lang === 'ar' ? 'المؤشر الرأسمالي' : 'Capital Allocation Metric'}</th>
                    <th>{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
                    <th>{lang === 'ar' ? 'العائد الإضافي المتوقع (3 سنوات)' : 'Projected 3-Yr Extra Revenue'}</th>
                    <th>{lang === 'ar' ? 'الأداة الموصى بها' : 'Recommended Vehicle'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-semibold">{t.deployableIdleCash}</td>
                    <td className="font-bold">
                      <MoneyDisplay amount={allocation.deployableCash} currency={report.currency} decimals={0} />
                    </td>
                    <td className="amount-income font-bold">
                      +<MoneyDisplay amount={potential3YrBalanced} currency={report.currency} decimals={0} />
                    </td>
                    <td>{isEgp ? 'صناديق المؤشرات / الأسهم المصرية (Thndr)' : 'S&P 500 Index ETFs / IBKR'}</td>
                  </tr>
                  <tr>
                    <td>{t.emergencyFundReserve} (3 mo)</td>
                    <td>
                      <MoneyDisplay amount={allocation.emergencyReserve} currency={report.currency} decimals={0} />
                    </td>
                    <td className="amount-income">
                      +<MoneyDisplay amount={potential3YrConservative} currency={report.currency} decimals={0} />
                    </td>
                    <td>{isEgp ? 'أذون خزانة وشهادات ادخار بنكية' : 'Treasury Bills / High-Yield CDs'}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          )}

          {/* Section 3: Spending Breakdown */}
          {categories.length > 0 && (
            <section className="report-section page-break-inside-avoid">
              <h2 className="report-section-title">{t.topSpendingCategories}</h2>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>{t.categoryLabel}</th>
                    <th>{t.amountLabel}</th>
                    <th>{t.shareLabel}</th>
                    <th>{t.countLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.slice(0, 8).map((cat) => (
                    <tr key={cat.category}>
                      <td className="font-medium">{cat.category}</td>
                      <td className="font-semibold">
                        <MoneyDisplay
                          amount={cat.amount}
                          currency={report.currency}
                          decimals={2}
                        />
                      </td>
                      <td>
                        <div className="report-pct-bar-wrap">
                          <div
                            className="report-pct-bar-fill"
                            style={{ width: `${Math.min(cat.percentage || 0, 100)}%` }}
                          />
                          <span className="report-pct-text">{(cat.percentage || 0).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td>{cat.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Section 4: AI Strategic Insights */}
          {insightsList && insightsList.length > 0 && (
            <section className="report-section page-break-inside-avoid">
              <h2 className="report-section-title">{t.aiObservationsTitle}</h2>
              <div className="report-insights-list">
                {insightsList.map((insight, idx) => {
                  const isRec =
                    insight.toLowerCase().includes('recommendation') ||
                    insight.startsWith('توصية');
                  return (
                    <div
                      key={idx}
                      className={`report-insight-card ${isRec ? 'report-insight-rec' : ''}`}
                    >
                      <p className="report-insight-text">{insight}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Document Sign-off Footer */}
          <footer className="report-doc-footer">
            <div className="report-footer-divider" />
            <div className="report-footer-content">
              <span>{t.appTitle} — Automated Statement Intelligence</span>
              <span>{t.reportGeneratedOn}: {currentDateFormatted}</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
