import { translations } from './translations';
import { formatCurrency } from '../utils/currency';
import type { Language } from '../types';

export { translations };
export { formatCurrency };

/**
 * Translates an English category string to the active language.
 */
export function translateCategory(cat: string, lang: Language): string {
  if (lang === 'en') return cat;
  const map: Record<string, string> = {
    'Food & Dining': 'مأكولات ومطاعم',
    'Groceries': 'بقالة وسوبرماركت',
    'Shopping': 'تسوق وتجزئة',
    'Transportation': 'مواصلات ونقل',
    'Housing & Rent': 'السكن والإيجار',
    'Utilities & Bills': 'فواتير وخدمات',
    'Healthcare': 'رعاية صحية وصيدليات',
    'Entertainment & Subscriptions': 'ترفيه واشتراكات',
    'Travel': 'سفر وطيران',
    'Education': 'تعليم ودراسة',
    'Fuel & Automotive': 'وقود وصيانة سيارات',
    'Salary & Income': 'رواتب ودخل رئيسي',
    'Freelance Income': 'دخل العمل الحر',
    'Bank Interest': 'فوائد بنكية',
    'Transfers': 'تحويلات داخلية',
    'Debt Payments': 'سداد ديون وبطاقات',
    'Other': 'أخرى'
  };
  return map[cat] || cat;
}

/**
 * Translates an insight line into natural, fluent Arabic.
 */
export function translateInsight(text: string, lang: Language): string {
  if (lang === 'en') return text;

  let str = text.trim();

  // 1. Positive Cash flow
  const posFlowMatch = str.match(/Observation:\s*Strong positive net cash flow of\s+([A-Z]{3})\s+([0-9,.]+)\s+achieved across the statement period, representing an approximate\s+(\d+)%\s+net savings rate\./i);
  if (posFlowMatch) {
    const curr = formatCurrency(posFlowMatch[1], 'ar');
    return `ملاحظة: تم تحقيق صافي تدفق نقدي إيجابي قوي قدره ${posFlowMatch[2]} ${curr} طوال فترة كشف الحساب، وهو ما يمثل معدل ادخار تقريبي يبلغ ${posFlowMatch[3]}%.`;
  }

  // 2. Negative Cash flow
  const negFlowMatch = str.match(/Observation:\s*Negative cash flow of\s+([A-Z]{3})\s+([0-9,.]+)\s+detected over the statement period\./i);
  if (negFlowMatch) {
    const curr = formatCurrency(negFlowMatch[1], 'ar');
    return `ملاحظة: تم رصد تدفق نقدي سالب قدره ${negFlowMatch[2]} ${curr} خلال فترة كشف الحساب.`;
  }

  // 3. Top category
  const topCatMatch = str.match(/Observation:\s*"([^"]+)"\s+represents the single largest expenditure category at\s+([A-Z]{3})\s+([0-9,.]+)\s+\(([0-9.]+)%\s+of all spending\)\./i);
  if (topCatMatch) {
    const catAr = translateCategory(topCatMatch[1], 'ar');
    const curr = formatCurrency(topCatMatch[2], 'ar');
    return `ملاحظة: فئة "${catAr}" تمثل الفئة الأكبر منفردة من حيث حجم الإنفاق بقيمة ${topCatMatch[3]} ${curr} (${topCatMatch[4]}% من إجمالي النفقات).`;
  }

  // 4. Income diversification
  const incMatch = str.match(/Observation:\s*Income is diversified with\s+(\d+)%\s*\(([A-Z]{3})\s+([0-9,.]+)\)\s*originating from freelance\/contracting work and\s+(\d+)%\s*\(([A-Z]{3})\s+([0-9,.]+)\)\s*from primary salary\./i);
  if (incMatch) {
    const curr1 = formatCurrency(incMatch[2], 'ar');
    const curr2 = formatCurrency(incMatch[5], 'ar');
    return `ملاحظة: مصادر الدخل متنوعة حيث تشكل أعمال العمل الحر والتعاقدات ${incMatch[1]}% (${incMatch[3]} ${curr1}) بينما يشكل الراتب الأساسي ${incMatch[4]}% (${incMatch[6]} ${curr2}).`;
  }

  // 5. Recurring obligations
  const recMatch = str.match(/Observation:\s*Major recurring monthly commitments include\s+(.+)\./i);
  if (recMatch) {
    let listAr = recMatch[1];
    listAr = listAr.replace(/~([A-Z]{3})\s+([0-9,.]+)\/mo/g, (_m, c, a) => `~${a} ${formatCurrency(c, 'ar')}/شهر`);
    listAr = listAr.replace(/EGP/g, 'ج.م').replace(/USD/g, 'دولار').replace(/QAR/g, 'ر.ق');
    return `ملاحظة: تشمل الالتزامات الشهرية الدورية الرئيسية ${listAr}.`;
  }

  // 6. Interest charged
  const intChargeMatch = str.match(/Observation:\s*A total of\s+([A-Z]{3})\s+([0-9,.]+)\s+was charged in credit card purchase interest over the statement period\./i);
  if (intChargeMatch) {
    const curr = formatCurrency(intChargeMatch[1], 'ar');
    return `ملاحظة: تم احتساب فوائد شراء على البطاقة الائتمانية بإجمالي ${intChargeMatch[2]} ${curr} خلال فترة كشف الحساب.`;
  }

  // 7. Interest recommendation
  const intRecMatch = str.match(/Recommendation:\s*Consider clearing credit card balances before the monthly billing cycle to eliminate interest charges, currently totaling\s+([A-Z]{3})\s+([0-9,.]+)\./i);
  if (intRecMatch) {
    const curr = formatCurrency(intRecMatch[1], 'ar');
    return `توصية: يُنصح بسداد أرصدة البطاقة الائتمانية قبل نهاية دورة الفوترة الشهرية لتفادي رسوم الفوائد البالغة حالياً ${intRecMatch[2]} ${curr}.`;
  }

  // 8. Prompt autopay
  const autoPayMatch = str.match(/Observation:\s*Credit card payments totaled\s+([A-Z]{3})\s+([0-9,.]+)\s+with zero finance charges, demonstrating prompt autopay settlements\./i);
  if (autoPayMatch) {
    const curr = formatCurrency(autoPayMatch[1], 'ar');
    return `ملاحظة: بلغ إجمالي مدفوعات البطاقة الائتمانية ${autoPayMatch[2]} ${curr} دون أي رسوم تمويل، مما يعكس انتظام عمليات السداد التلقائي.`;
  }

  // 9. All reconciled
  if (/Observation:\s*All accounts .* 100% mathematically reconciled/i.test(str)) {
    return `ملاحظة: تمت مطابقة أرصدة جميع الحسابات (الجاري، التوفير، البطاقة الائتمانية) حسابياً بنسبة 100% مع ملخصات نهاية الكشف.`;
  }

  // Fallback prefix and currency replacement
  str = str.replace(/^Observation:\s*/i, 'ملاحظة: ');
  str = str.replace(/^Recommendation:\s*/i, 'توصية: ');
  str = str.replace(/\bEGP\b/g, 'ج.م').replace(/\bUSD\b/g, 'دولار').replace(/\bQAR\b/g, 'ر.ق');
  return str;
}
