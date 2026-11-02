import axios from 'axios';
import { OpenRouterService } from './openRouter.service.js';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StatementChatPayload {
  question: string;
  report: any; // FinancialReport
  history?: ChatMessage[];
  lang?: 'en' | 'ar';
}

export class StatementChatService {
  private static baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  private static model = process.env.OPENROUTER_MODEL || '';
  private static apiKey = process.env.OPENROUTER_API_KEY || '';

  /**
   * Main entry point to answer customer questions about their statement.
   */
  static async answerQuestion(payload: StatementChatPayload): Promise<string> {
    const { question, report, history = [], lang = 'en' } = payload;
    const isAr = lang === 'ar' || /[\u0600-\u06FF]/.test(question);

    // 1. If OpenRouter is configured, try LLM first
    if (OpenRouterService.isConfigured()) {
      try {
        const aiAnswer = await this.queryLLM(question, report, history, isAr);
        if (aiAnswer && aiAnswer.trim().length > 0) {
          return aiAnswer.trim();
        }
      } catch (err: any) {
        console.warn('[StatementChatService] LLM query failed, falling back to local solver:', err.message);
      }
    }

    // 2. Local intelligent heuristic fallback solver (guarantees fast, accurate answers offline or on 401)
    return this.solveQueryLocally(question, report, isAr);
  }

  /**
   * Queries OpenRouter LLM with curated financial context.
   */
  private static async queryLLM(
    question: string,
    report: any,
    history: ChatMessage[],
    isAr: boolean
  ): Promise<string> {
    const summary = report.overallSummary || {};
    const categories = report.spendingAnalysis?.categoryBreakdown || [];
    const accounts = report.accounts || [];
    const transactions = report.transactions || [];

    // Extract top 15 largest expenses
    const largestExpenses = [...transactions]
      .filter((t: any) => t.flowType === 'EXPENSE' || t.flowType === 'INTEREST_EXPENSE')
      .sort((a: any, b: any) => b.amount - a.amount)
      .slice(0, 15)
      .map((t: any) => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category,
        account: t.accountNumber
      }));

    // Extract fee/tax transactions
    const feeTransactions = transactions
      .filter((t: any) => {
        const desc = (t.description || '').toLowerCase();
        return (
          desc.includes('fee') ||
          desc.includes('tax') ||
          desc.includes('charge') ||
          desc.includes('cost') ||
          desc.includes('دمغة') ||
          desc.includes('مصاريف') ||
          desc.includes('عمولة')
        );
      })
      .slice(0, 10)
      .map((t: any) => ({
        date: t.date,
        description: t.description,
        amount: t.amount
      }));

    const systemPrompt = `You are an elite AI Banking & Financial Copilot embedded inside BankIQ, the AI-Powered Financial Intelligence Platform.
Your task is to answer user questions about their bank statement with total precision, citing exact numbers, dates, and percentages from the provided context.

Context:
- Statement Period: ${report.statementPeriod?.start} to ${report.statementPeriod?.end}
- Currency: ${report.currency}
- Total Income: ${summary.totalIncome?.toFixed(2)}
- Total Expenses: ${summary.totalExpenses?.toFixed(2)}
- Net Cash Flow: ${summary.netCashFlow?.toFixed(2)}
- Total Transactions: ${summary.transactionCount}
- Accounts: ${JSON.stringify(
      accounts.map((a: any) => ({
        number: a.accountNumber,
        type: a.accountType,
        endingBalance: a.endingBalance,
        totalDeposits: a.totalDepositsOrCredits,
        totalWithdrawals: a.totalWithdrawalsOrDebits
      }))
    )}
- Top Spending Categories: ${JSON.stringify(
      categories.map((c: any) => ({
        category: c.category,
        amount: c.amount,
        percentage: `${c.percentage}%`,
        count: c.count
      }))
    )}
- Largest Transactions: ${JSON.stringify(largestExpenses)}
- Known Bank Fees / Taxes: ${JSON.stringify(feeTransactions)}

Instructions:
1. Always respond in ${isAr ? 'Arabic (العربية الفصحى البسيطة والودودة)' : 'English'}.
2. Be concise, direct, helpful, and format key numbers and terms with markdown bold (e.g. **5,000 ${report.currency}**).
3. If asked about a category (like Food, Shopping, etc.), state the total spent, share of total, and cite 1-2 examples if available.
4. If asked if they can afford an expense or installment, compare against their net monthly cash flow (**${summary.netCashFlow?.toFixed(2)} ${report.currency}**).
5. Never invent or hallucinate transactions not in the data. If not found, say so politely.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: question }
    ];

    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: this.model,
        messages,
        temperature: 0.3,
        max_tokens: 500
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://localhost:3000',
          'X-Title': 'BankIQ Copilot'
        },
        timeout: 20000
      }
    );

    return response.data?.choices?.[0]?.message?.content || '';
  }

  /**
   * Deterministic local solver when LLM is unavailable or offline.
   */
  private static solveQueryLocally(question: string, report: any, isAr: boolean): string {
    const q = question.toLowerCase();
    const currency = report.currency || 'EGP';
    const summary = report.overallSummary || {};
    const categories: any[] = report.spendingAnalysis?.categoryBreakdown || [];
    const transactions: any[] = report.transactions || [];

    // 1. Largest / Highest Expense
    if (
      q.includes('largest') ||
      q.includes('biggest') ||
      q.includes('highest') ||
      q.includes('most expensive') ||
      q.includes('أكبر') ||
      q.includes('أعلى') ||
      q.includes('اغلى')
    ) {
      const expenses = transactions.filter((t: any) => t.flowType === 'EXPENSE' || t.flowType === 'INTEREST_EXPENSE');
      if (expenses.length > 0) {
        const top = [...expenses].sort((a: any, b: any) => b.amount - a.amount)[0];
        return isAr
          ? `أكبر عملية إنفاق في كشف حسابك هي **${top.description}** بقيمة **${top.amount.toLocaleString()} ${currency}** بتاريخ **${top.date}** (فئة: ${top.category || 'أخرى'}).`
          : `Your largest expense was **${top.description}** amounting to **${top.amount.toLocaleString()} ${currency}** on **${top.date}** (Category: ${top.category || 'Other'}).`;
      }
    }

    // 2. Fees & Taxes
    if (
      q.includes('fee') ||
      q.includes('tax') ||
      q.includes('charge') ||
      q.includes('رسوم') ||
      q.includes('دمغة') ||
      q.includes('مصاريف') ||
      q.includes('عمولة')
    ) {
      const fees = transactions.filter((t: any) => {
        const desc = (t.description || '').toLowerCase();
        return (
          desc.includes('fee') ||
          desc.includes('tax') ||
          desc.includes('charge') ||
          desc.includes('cost') ||
          desc.includes('دمغة') ||
          desc.includes('مصاريف') ||
          desc.includes('عمولة')
        );
      });

      const totalFees = fees.reduce((sum: number, t: any) => sum + t.amount, 0);

      if (fees.length > 0) {
        const feeList = fees
          .slice(0, 4)
          .map((f: any) => `• ${f.description}: **${f.amount.toLocaleString()} ${currency}** (${f.date})`)
          .join('\n');

        return isAr
          ? `تم رصد **${fees.length}** رسوم ودمغات بنكية بإجمالي **${totalFees.toLocaleString()} ${currency}**:\n${feeList}\n\nيُنصح بمراجعة هذه الرسوم مع البنك للتأكد من عدم تكرارها.`
          : `Detected **${fees.length}** bank fees and debit taxes totaling **${totalFees.toLocaleString()} ${currency}**:\n${feeList}\n\nWe recommend verifying these charges to avoid unnecessary recurrent costs.`;
      } else {
        return isAr
          ? `لم يتم العثور على أي رسوم بنكية أو دمغات إضافية ظاهرة في كشف الحساب الحالي.`
          : `No explicit bank fees or debit taxes were detected in your current statement.`;
      }
    }

    // 3. Category Spending (Food, Groceries, Shopping, Transportation, etc.)
    const categoryKeywords: Record<string, string[]> = {
      'Food & Dining': ['food', 'dining', 'restaurant', 'cafe', 'مطاعم', 'أكل', 'كافيهات', 'وجبات'],
      'Groceries': ['groceries', 'supermarket', 'market', 'بقالة', 'سوبرماركت', 'تموين'],
      'Shopping': ['shopping', 'clothes', 'electronics', 'تسوق', 'ملابس', 'مشتريات'],
      'Transportation': ['transport', 'transportation', 'uber', 'taxi', 'careem', 'مواصلات', 'أوبر', 'نقل'],
      'Utilities & Bills': ['bill', 'bills', 'electricity', 'water', 'internet', 'fawry', 'فواتير', 'كهرباء', 'مياه', 'إنترنت', 'فوري'],
      'Fuel & Automotive': ['fuel', 'gas', 'car', 'petrol', 'بنزين', 'وقود', 'سيارات', 'صيانة'],
      'Healthcare': ['health', 'pharmacy', 'hospital', 'صيدلية', 'علاج', 'أدوية', 'طبيب']
    };

    for (const [catName, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((k) => q.includes(k))) {
        const catData = categories.find(
          (c) => c.category.toLowerCase() === catName.toLowerCase()
        );
        if (catData) {
          return isAr
            ? `إجمالي إنفاقك على فئة **${catName}** هو **${catData.amount.toLocaleString()} ${currency}** (يمثل **${catData.percentage}%** من إجمالي نفقاتك) عبر **${catData.count}** معاملة.`
            : `You spent a total of **${catData.amount.toLocaleString()} ${currency}** on **${catName}** (${catData.percentage}% of total expenses) across **${catData.count}** transactions.`;
        }
      }
    }

    // 4. Income / Salary Inquiries
    if (q.includes('income') || q.includes('salary') || q.includes('دخل') || q.includes('مرتب') || q.includes('رواتب')) {
      return isAr
        ? `إجمالي الدخل المسجل في كشف حسابك هو **${(summary.totalIncome || 0).toLocaleString()} ${currency}** على مدار فترة الكشف.`
        : `Your total recorded income across this statement period is **${(summary.totalIncome || 0).toLocaleString()} ${currency}**.`;
    }

    // 5. Total Expenses / Outflows
    if (q.includes('expense') || q.includes('spending') || q.includes('نفقات') || q.includes('مصاريف') || q.includes('صرفت')) {
      return isAr
        ? `إجمالي النفقات الفعلية هو **${(summary.totalExpenses || 0).toLocaleString()} ${currency}** مع صافي تدفق نقدي **${(summary.netCashFlow || 0).toLocaleString()} ${currency}**.`
        : `Your total actual expenses were **${(summary.totalExpenses || 0).toLocaleString()} ${currency}**, leaving a net cash flow of **${(summary.netCashFlow || 0).toLocaleString()} ${currency}**.`;
    }

    // 6. Affordability / Loans / Installments
    if (
      q.includes('afford') ||
      q.includes('installment') ||
      q.includes('loan') ||
      q.includes('قسط') ||
      q.includes('تحمل') ||
      q.includes('أشتري') ||
      q.includes('قرض')
    ) {
      const net = summary.netCashFlow || 0;
      if (net > 0) {
        return isAr
          ? `بناءً على كشف حسابك، لديك فائض نقدي صافٍ قدره **${net.toLocaleString()} ${currency}**. يمكنك تخصيص ما يصل إلى 40% من هذا الفائض (حوالي **${Math.round(net * 0.4).toLocaleString()} ${currency}**) كأقساط شهرية آمنة دون الضغط على مصاريفك الأساسية.`
          : `Based on your statement, you have a positive net cash flow of **${net.toLocaleString()} ${currency}**. A healthy debt-to-income threshold allows up to 40% of this surplus (~**${Math.round(net * 0.4).toLocaleString()} ${currency}**) for safe monthly installments.`;
      } else {
        return isAr
          ? `كشف الحساب يوضح عجزاً أو توازناً دقيقاً في التدفق النقدي (${net.toLocaleString()} ${currency}). يُنصح بخفض المصروفات التقديرية أولاً قبل الالتزام بأي أقساط جديدة.`
          : `Your cash flow indicates a tight or negative balance (${net.toLocaleString()} ${currency}). It is advisable to cut discretionary spending before committing to new installments.`;
      }
    }

    // Default Smart Financial Summary
    return isAr
      ? `ملخص سريع لكشف حسابك للفترة من **${report.statementPeriod?.start || ''}** إلى **${report.statementPeriod?.end || ''}**:\n` +
          `• إجمالي الدخل: **${(summary.totalIncome || 0).toLocaleString()} ${currency}**\n` +
          `• إجمالي النفقات: **${(summary.totalExpenses || 0).toLocaleString()} ${currency}**\n` +
          `• صافي الفائض: **${(summary.netCashFlow || 0).toLocaleString()} ${currency}**\n\n` +
          `يمكنك سؤالي عن أي فئة محددة، أكبر المصروفات، الرسوم البنكية، أو مدى قدرتك على تحمل أقساط معينة!`
      : `Quick summary of your statement from **${report.statementPeriod?.start || ''}** to **${report.statementPeriod?.end || ''}**:\n` +
          `• Total Income: **${(summary.totalIncome || 0).toLocaleString()} ${currency}**\n` +
          `• Total Expenses: **${(summary.totalExpenses || 0).toLocaleString()} ${currency}**\n` +
          `• Net Surplus: **${(summary.netCashFlow || 0).toLocaleString()} ${currency}**\n\n` +
          `You can ask me about specific categories, largest purchases, bank fees, or affordability of new expenses!`;
  }
}
