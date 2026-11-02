import { AICategory, Transaction } from '../types/index.js';
import { OpenRouterService, CategorizationRequestItem } from './openRouter.service.js';

export class TransactionCategorizerService {
  /**
   * Check deterministic rule for obvious transactions.
   */
  static getDeterministicCategory(tx: Partial<Transaction>): {
    category: AICategory;
    confidence: number;
  } | null {
    const desc = (tx.description || '').toUpperCase();
    const flow = tx.flowType;

    if (flow === 'INTERNAL_TRANSFER') {
      return { category: 'Transfers', confidence: 1.0 };
    }
    if (flow === 'DEBT_PAYMENT') {
      return { category: 'Debt Payments', confidence: 1.0 };
    }
    if (flow === 'INTEREST_INCOME') {
      return { category: 'Bank Interest', confidence: 1.0 };
    }
    if (flow === 'INTEREST_EXPENSE') {
      return { category: 'Debt Payments', confidence: 1.0 };
    }
    if (desc.includes('SALARY')) {
      return { category: 'Salary & Income', confidence: 1.0 };
    }
    if (desc.includes('FREELANCE') || desc.includes('UPWORK')) {
      return { category: 'Freelance Income', confidence: 1.0 };
    }
    if (desc.includes('RENT PAYMENT') || desc.includes('RENT')) {
      return { category: 'Housing & Rent', confidence: 1.0 };
    }
    if (desc.includes('BRANCH DEPOSIT') || desc.includes('CASH DEPOSIT')) {
      return { category: 'Salary & Income', confidence: 0.95 };
    }
    if (
      desc.includes('BRANCH-TRANSACTION') ||
      desc.includes('TRANSACTION TO') ||
      desc.includes('FUND TRANSFER') ||
      desc.includes('ATM CASH') ||
      desc.includes('CASH WITHDRAWAL')
    ) {
      return { category: 'Transfers', confidence: 0.95 };
    }
    if (desc.includes('CHEQUE') || desc.includes('BANK CHEQUE') || desc.includes('DEBITS TAX') || desc.includes('TAX')) {
      return { category: 'Utilities & Bills', confidence: 0.95 };
    }

    return null;
  }

  /**
   * Keyword-based categorization fallback.
   */
  static getKeywordCategory(description: string): {
    category: AICategory;
    confidence: number;
  } {
    const desc = description.toUpperCase();

    // Food & Dining
    if (
      desc.includes('TALABAT') ||
      desc.includes('BUFFALO BURGER') ||
      desc.includes('CILANTRO') ||
      desc.includes('COSTA') ||
      desc.includes('MAKANI') ||
      desc.includes('ABOU TAREK') ||
      desc.includes('MCDONALD') ||
      desc.includes('KFC') ||
      desc.includes('BURGER') ||
      desc.includes('CAFE') ||
      desc.includes('COFFEE') ||
      desc.includes('RESTAURANT') ||
      desc.includes('BAKERY') ||
      desc.includes('PIZZA')
    ) {
      return { category: 'Food & Dining', confidence: 0.9 };
    }

    // Groceries
    if (
      desc.includes('KAZYON') ||
      desc.includes('METRO MARKET') ||
      desc.includes('CARREFOUR') ||
      desc.includes('GOURMET') ||
      desc.includes('SPINNEYS') ||
      desc.includes('SEOUDI') ||
      desc.includes('HYPERONE') ||
      desc.includes('LULU') ||
      desc.includes('HYPERMARKET') ||
      desc.includes('SUPERMARKET') ||
      desc.includes('GROCERY') ||
      desc.includes('MARKET')
    ) {
      return { category: 'Groceries', confidence: 0.9 };
    }

    // Utilities & Bills
    if (
      desc.includes('VODAFONE') ||
      desc.includes('TOWN GAS') ||
      desc.includes('ELECTRICITY') ||
      desc.includes('WATER AUTHORITY') ||
      desc.includes('WE INTERNET') ||
      desc.includes('ORANGE') ||
      desc.includes('FAWRY') ||
      desc.includes('ETISALAT') ||
      desc.includes('KAHRAMAA') ||
      desc.includes('TELECOM') ||
      desc.includes('UTILITY')
    ) {
      return { category: 'Utilities & Bills', confidence: 0.95 };
    }

    // Fuel & Automotive
    if (
      desc.includes('MOBIL AUTOCARE') ||
      desc.includes('TOTALENERGIES') ||
      desc.includes('WATANYA') ||
      desc.includes('PETROL') ||
      desc.includes('GAS STATION') ||
      desc.includes('AUTOCARE') ||
      desc.includes('CHILLOUT') ||
      desc.includes('MISR PETROLEUM') ||
      desc.includes('SHELL')
    ) {
      return { category: 'Fuel & Automotive', confidence: 0.9 };
    }

    // Transportation
    if (
      desc.includes('UBER') ||
      desc.includes('CAREEM') ||
      desc.includes('SWVL') ||
      desc.includes('TAXI') ||
      desc.includes('METRO TICKET')
    ) {
      return { category: 'Transportation', confidence: 0.95 };
    }

    // Travel
    if (
      desc.includes('EGYPTAIR') ||
      desc.includes('AIRWAYS') ||
      desc.includes('AIRLINE') ||
      desc.includes('FLIGHT') ||
      desc.includes('BOOKING.COM') ||
      desc.includes('HOTEL')
    ) {
      return { category: 'Travel', confidence: 0.95 };
    }

    // Healthcare
    if (
      desc.includes('PHARMACY') ||
      desc.includes('EL EZABY') ||
      desc.includes('SEIF') ||
      desc.includes('HOSPITAL') ||
      desc.includes('CLINIC') ||
      desc.includes('LAB') ||
      desc.includes('DOCTOR')
    ) {
      return { category: 'Healthcare', confidence: 0.95 };
    }

    // Entertainment & Subscriptions
    if (
      desc.includes('NETFLIX') ||
      desc.includes('SPOTIFY') ||
      desc.includes('ANGHAMI') ||
      desc.includes('CINEMA') ||
      desc.includes('YOUTUBE') ||
      desc.includes('DISNEY') ||
      desc.includes('PRIME VIDEO') ||
      desc.includes('PLAYSTATION')
    ) {
      return { category: 'Entertainment & Subscriptions', confidence: 0.95 };
    }

    // Shopping
    if (
      desc.includes('B.TECH') ||
      desc.includes('DECATHLON') ||
      desc.includes('VIRGIN MEGASTORE') ||
      desc.includes('2B COMPUTER') ||
      desc.includes('AMAZON') ||
      desc.includes('NOON') ||
      desc.includes('ZARA') ||
      desc.includes('IKEA') ||
      desc.includes('MALL') ||
      desc.includes('STORE')
    ) {
      return { category: 'Shopping', confidence: 0.9 };
    }

    // Housing & Rent
    if (desc.includes('RENT') || desc.includes('MORTGAGE') || desc.includes('COMPOUND')) {
      return { category: 'Housing & Rent', confidence: 0.9 };
    }

    // Education
    if (desc.includes('SCHOOL') || desc.includes('UNIVERSITY') || desc.includes('TUITION') || desc.includes('COURSERA') || desc.includes('UDEMY')) {
      return { category: 'Education', confidence: 0.9 };
    }

    return { category: 'Other', confidence: 0.5 };
  }

  /**
   * Categorize all transactions using:
   * 1. Deterministic rules
   * 2. OpenRouter API batching (for remaining items)
   * 3. Keyword fallback if OpenRouter fails or is unavailable
   */
  static async categorizeTransactions(
    transactions: Transaction[]
  ): Promise<{ transactions: Transaction[]; aiUsed: boolean }> {
    let aiUsed = false;
    const needsAi: { index: number; item: CategorizationRequestItem }[] = [];

    // Step 1: Deterministic pass
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      const deterministic = this.getDeterministicCategory(tx);
      if (deterministic) {
        tx.category = deterministic.category;
        tx.categoryConfidence = deterministic.confidence;
        tx.categorySource = 'rule';
      } else {
        needsAi.push({
          index: i,
          item: {
            id: tx.id,
            description: tx.description,
            amount: tx.amount,
            flowType: tx.flowType
          }
        });
      }
    }

    // Step 2: OpenRouter batching if configured
    if (needsAi.length > 0 && OpenRouterService.isConfigured()) {
      const batchSize = 30;
      for (let i = 0; i < needsAi.length; i += batchSize) {
        const chunk = needsAi.slice(i, i + batchSize);
        const requestItems = chunk.map((c) => c.item);
        const aiResults = await OpenRouterService.categorizeBatch(requestItems);

        if (aiResults.size > 0) {
          aiUsed = true;
          for (const { index, item } of chunk) {
            const aiResult = aiResults.get(item.id);
            if (aiResult) {
              transactions[index].category = aiResult.category;
              transactions[index].categoryConfidence = aiResult.confidence;
              transactions[index].categorySource = 'ai';
            }
          }
        }
      }
    }

    // Step 3: Keyword fallback for any item still uncategorized or without AI
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      if (!tx.category || tx.categorySource === 'fallback' || !tx.categoryConfidence) {
        const fallback = this.getKeywordCategory(tx.description);
        tx.category = fallback.category;
        tx.categoryConfidence = fallback.confidence;
        tx.categorySource = 'fallback';
      }
    }

    return { transactions, aiUsed };
  }
}
