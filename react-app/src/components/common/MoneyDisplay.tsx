import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency } from '../../utils/currency';

interface MoneyDisplayProps {
  amount: number;
  currency?: string;
  sign?: '+' | '-' | '';
  decimals?: number;
  className?: string;
}

export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({
  amount,
  currency = 'EGP',
  sign = '',
  decimals,
  className = ''
}) => {
  const { lang, isRtl } = useLanguage();
  const sym = formatCurrency(currency, lang);

  const formattedNum =
    decimals !== undefined
      ? amount.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        })
      : amount.toLocaleString();

  if (isRtl) {
    // In Arabic: Amount (isolated LTR digits & sign) followed by localized currency
    return (
      <span className={`money-val ${className}`}>
        <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
          {sign}{formattedNum}
        </span>{' '}
        <span className="money-currency">{sym}</span>
      </span>
    );
  }

  // In English: Sign then Currency then Amount
  return (
    <span className={`money-val ${className}`}>
      {sign ? `${sign}` : ''}{sym} {formattedNum}
    </span>
  );
};
