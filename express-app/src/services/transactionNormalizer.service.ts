import { RawExtractedTransaction, Transaction } from '../types/index.js';
import { TransactionClassifierService } from './transactionClassifier.service.js';

export class TransactionNormalizerService {
  /**
   * Normalizes a raw extracted transaction into the canonical Transaction model.
   */
  static normalize(raw: RawExtractedTransaction, index: number): Transaction {
    // 1. Validate date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const validDate = dateRegex.test(raw.date.trim()) ? raw.date.trim() : new Date().toISOString().split('T')[0];

    // 2. Validate amount
    const cleanAmount = Math.abs(raw.amount);

    // 3. Classify flow type and direction
    const { flowType, direction } = TransactionClassifierService.classifyTransaction(
      raw.accountType,
      raw.columnType,
      raw.description
    );

    // 4. Generate unique ID
    const id = `tx-${raw.accountType}-${raw.date}-${index}-${Math.random().toString(36).substring(2, 7)}`;

    return {
      id,
      date: validDate,
      description: raw.description.trim(),
      amount: cleanAmount,
      currency: raw.currency || 'EGP',
      accountType: raw.accountType,
      accountNumber: raw.accountNumber,
      direction,
      flowType,
      category: '',
      categoryConfidence: 0,
      categorySource: 'rule',
      balance: raw.balance,
      originalData: {
        columnType: raw.columnType,
        rawLine: raw.rawLine
      }
    };
  }

  /**
   * Normalizes an entire array of raw transactions.
   */
  static normalizeAll(rawList: RawExtractedTransaction[]): Transaction[] {
    return rawList.map((raw, idx) => this.normalize(raw, idx));
  }
}
