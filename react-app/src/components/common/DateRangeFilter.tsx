import React from 'react';
import { Calendar, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  minDate?: string;
  maxDate?: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onResetDateRange: () => void;
  filteredCount?: number;
  totalCount?: number;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  minDate,
  maxDate,
  onStartDateChange,
  onEndDateChange,
  onResetDateRange,
  filteredCount,
  totalCount
}) => {
  const { t } = useLanguage();

  const isFiltered = Boolean(startDate || endDate);

  return (
    <div className="date-range-filter-card">
      <div className="date-range-header">
        <div className="date-range-title">
          <Calendar size={16} className="date-range-icon" />
          <span>{t.dateRangeFilter}</span>
        </div>

        {totalCount !== undefined && filteredCount !== undefined && (
          <div className="date-range-count-badge">
            {filteredCount} / {totalCount} {t.transactionsExtracted}
          </div>
        )}
      </div>

      <div className="date-range-inputs-row">
        {/* From Date */}
        <div className="date-input-group">
          <label className="date-input-label">{t.fromDate}</label>
          <input
            type="date"
            className="date-picker-input"
            value={startDate}
            min={minDate}
            max={endDate || maxDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>

        {/* To Date */}
        <div className="date-input-group">
          <label className="date-input-label">{t.toDate}</label>
          <input
            type="date"
            className="date-picker-input"
            value={endDate}
            min={startDate || minDate}
            max={maxDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>

        {/* Quick Reset / All Period Button */}
        {isFiltered && (
          <button
            type="button"
            className="btn btn-outline btn-sm date-reset-btn"
            onClick={onResetDateRange}
            title={t.clearDateFilter}
          >
            <RotateCcw size={14} />
            <span>{t.allDates}</span>
          </button>
        )}
      </div>
    </div>
  );
};
