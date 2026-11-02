import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown, Printer } from 'lucide-react';
import type { FinancialReport, Transaction } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { exportTransactionsToCSV, exportExecutiveSummaryToCSV } from '../../utils/export';

interface ExportDropdownProps {
  report: FinancialReport;
  filteredTransactions?: Transaction[];
  onOpenExecutivePdf: () => void;
  className?: string;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  report,
  filteredTransactions,
  onOpenExecutivePdf,
  className = ''
}) => {
  const { lang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportFilteredCsv = () => {
    const list = filteredTransactions && filteredTransactions.length > 0
      ? filteredTransactions
      : report.transactions;

    exportTransactionsToCSV({
      transactions: list,
      currency: report.currency,
      filename: `statement_filtered_${report.statementPeriod.start}_${report.statementPeriod.end}.csv`,
      lang
    });
    setIsOpen(false);
  };

  const handleExportAllCsv = () => {
    exportTransactionsToCSV({
      transactions: report.transactions,
      currency: report.currency,
      filename: `statement_all_${report.statementPeriod.start}_${report.statementPeriod.end}.csv`,
      lang
    });
    setIsOpen(false);
  };

  const handleExportSummaryCsv = () => {
    exportExecutiveSummaryToCSV(report, lang);
    setIsOpen(false);
  };

  const handleOpenPdf = () => {
    onOpenExecutivePdf();
    setIsOpen(false);
  };

  return (
    <div className={`export-dropdown-wrapper ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className="btn btn-outline export-main-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <Download size={16} className="export-btn-icon" />
        <span>{t.export}</span>
        <ChevronDown size={14} className={`export-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="export-menu-card animate-fade-in">
          <div className="export-menu-header">
            <span className="export-menu-title">{t.exportOptions}</span>
          </div>

          <div className="export-menu-list">
            {/* Executive PDF Report */}
            <button
              type="button"
              className="export-menu-item item-highlight"
              onClick={handleOpenPdf}
            >
              <div className="export-item-icon-wrap pdf-icon">
                <Printer size={16} />
              </div>
              <div className="export-item-text">
                <span className="export-item-title">{t.exportExecutivePdf}</span>
                <span className="export-item-desc">Print-ready / Save as PDF with KPIs & Insights</span>
              </div>
            </button>

            <div className="export-menu-divider" />

            {/* Filtered CSV */}
            {filteredTransactions && filteredTransactions.length < report.transactions.length && (
              <button
                type="button"
                className="export-menu-item"
                onClick={handleExportFilteredCsv}
              >
                <div className="export-item-icon-wrap csv-icon">
                  <FileSpreadsheet size={16} />
                </div>
                <div className="export-item-text">
                  <span className="export-item-title">{t.exportCsvFiltered}</span>
                  <span className="export-item-desc">
                    {filteredTransactions.length} {t.transactionsParsed}
                  </span>
                </div>
              </button>
            )}

            {/* All Transactions CSV */}
            <button
              type="button"
              className="export-menu-item"
              onClick={handleExportAllCsv}
            >
              <div className="export-item-icon-wrap csv-icon">
                <FileSpreadsheet size={16} />
              </div>
              <div className="export-item-text">
                <span className="export-item-title">{t.exportCsvAll}</span>
                <span className="export-item-desc">
                  {report.transactions.length} {t.transactionsParsed} (UTF-8 Excel)
                </span>
              </div>
            </button>

            {/* Executive Summary CSV */}
            <button
              type="button"
              className="export-menu-item"
              onClick={handleExportSummaryCsv}
            >
              <div className="export-item-icon-wrap summary-icon">
                <FileText size={16} />
              </div>
              <div className="export-item-text">
                <span className="export-item-title">{t.exportSummaryCsv}</span>
                <span className="export-item-desc">Metrics & Category Breakdown</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
