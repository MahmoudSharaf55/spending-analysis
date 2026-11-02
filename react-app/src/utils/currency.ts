import type { Language } from '../types';

/**
 * Maps standard ISO currency codes to natural localized strings.
 */
const CURRENCY_AR_MAP: Record<string, string> = {
  EGP: 'ج.م',
  LE: 'ج.م',
  'L.E.': 'ج.م',
  USD: 'دولار',
  $: 'دولار',
  QAR: 'ر.ق',
  EUR: 'يورو',
  '€': 'يورو',
  AED: 'د.إ',
  SAR: 'ر.س',
  GBP: 'ج.إ',
  '£': 'ج.إ',
  KWD: 'د.ك',
  BHD: 'د.ب',
  OMR: 'ر.ع',
  JOD: 'د.أ'
};

/**
 * Formats a currency code according to language.
 */
export function formatCurrency(currency: string, lang: Language): string {
  if (lang === 'en') return (currency || 'EGP').trim();
  const upper = (currency || 'EGP').trim().toUpperCase();
  return CURRENCY_AR_MAP[upper] || upper;
}

/**
 * Returns formatted money string (e.g. for tooltips and charts).
 */
export function formatMoneyString(
  amount: number,
  currency: string,
  lang: Language,
  sign: '+' | '-' | '' = '',
  decimals?: number
): string {
  const sym = formatCurrency(currency, lang);
  const formattedVal =
    decimals !== undefined
      ? amount.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        })
      : amount.toLocaleString();

  if (lang === 'ar') {
    // In Arabic: Amount first, then currency (e.g. "55,700 ج.م" or "+558.94 ج.م")
    return `${sign}${formattedVal} ${sym}`;
  }

  // In English: Currency first, then amount (e.g. "EGP 55,700" or "+EGP 558.94")
  return `${sign ? `${sign}` : ''}${sym} ${formattedVal}`;
}
