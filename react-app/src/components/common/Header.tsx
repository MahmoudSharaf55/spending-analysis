import React from 'react';
import { Globe, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { ThemeToggle } from './ThemeToggle';
import type { FinancialReport } from '../../types';

interface HeaderProps {
  report: FinancialReport | null;
  openRouterStatus: boolean;
}

export const Header: React.FC<HeaderProps> = ({ report, openRouterStatus }) => {
  const { lang, toggleLang, t } = useLanguage();

  return (
    <header className="dashboard-header">
      <div className="header-title-group">
        <h1>{t.appTitle}</h1>
        <p className="header-subtitle">{t.appSubtitle}</p>
      </div>

      <div className="header-badges">
        {/* Dark Mode Switcher */}
        <ThemeToggle />

        {/* Language Switcher */}
        <button
          className="lang-toggle-btn"
          onClick={toggleLang}
          title="Toggle Language / تغيير اللغة"
        >
          <Globe size={14} />
          <span>{t.languageToggle}</span>
        </button>

        {/* Statement Period Badge */}
        {report && (
          <span className="badge badge-info period-badge">
            <Calendar size={13} />
            <span>
              {report.statementPeriod.start} {lang === 'ar' ? 'إلى' : 'to'} {report.statementPeriod.end}
            </span>
          </span>
        )}

        {/* AI Connection Status Badge */}
        <span
          className={`badge ${openRouterStatus ? 'badge-success' : 'badge-warning'} ai-status-badge`}
        >
          {openRouterStatus ? (
            <>
              <CheckCircle2 size={12} /> {t.openRouterConnected}
            </>
          ) : (
            <>
              <AlertTriangle size={12} /> {t.ruleFallbackActive}
            </>
          )}
        </span>
      </div>
    </header>
  );
};
