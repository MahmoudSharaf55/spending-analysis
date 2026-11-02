import React from 'react';
import type { OverallSummary } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { MoneyDisplay } from '../common/MoneyDisplay';

interface SecondaryMetricsProps {
  summary: OverallSummary;
  currency: string;
}

export const SecondaryMetrics: React.FC<SecondaryMetricsProps> = ({ summary, currency }) => {
  const { t } = useLanguage();

  return (
    <div className="secondary-metrics-row">
      {/* Internal Transfers */}
      <div className="secondary-pill">
        <div className="secondary-pill-title">{t.internalTransfers}</div>
        <div className="secondary-pill-amount">
          <MoneyDisplay amount={summary.totalInternalTransfers} currency={currency} />
        </div>
      </div>

      {/* Credit Card Autopay */}
      <div className="secondary-pill">
        <div className="secondary-pill-title">{t.creditCardAutopay}</div>
        <div className="secondary-pill-amount">
          <MoneyDisplay amount={summary.totalCreditCardPayments} currency={currency} />
        </div>
      </div>

      {/* Interest Earned */}
      <div className="secondary-pill">
        <div className="secondary-pill-title">{t.interestEarned}</div>
        <div className="secondary-pill-amount text-success">
          <MoneyDisplay amount={summary.totalInterestEarned} currency={currency} sign="+" />
        </div>
      </div>

      {/* Interest Charged */}
      <div className="secondary-pill">
        <div className="secondary-pill-title">{t.interestCharged}</div>
        <div className="secondary-pill-amount text-danger">
          <MoneyDisplay amount={summary.totalInterestCharged} currency={currency} sign="-" />
        </div>
      </div>

      {/* Credit Card Liability */}
      <div className="secondary-pill">
        <div className="secondary-pill-title">{t.creditCardLiability}</div>
        <div className="secondary-pill-amount">
          <MoneyDisplay amount={summary.creditCardEndingLiability} currency={currency} />
        </div>
      </div>
    </div>
  );
};
