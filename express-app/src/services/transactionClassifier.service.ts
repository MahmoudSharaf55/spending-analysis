import { AccountType, FlowType } from '../types/index.js';

export class TransactionClassifierService {
  /**
   * Classify financial flow based on account context, column direction, and transaction description.
   */
  static classifyTransaction(
    accountType: AccountType,
    columnType: 'withdrawal' | 'deposit' | 'debit' | 'credit',
    description: string
  ): { flowType: FlowType; direction: 'debit' | 'credit' } {
    const desc = description.trim().toUpperCase();

    // 1. Current Account
    if (accountType === 'current') {
      if (columnType === 'withdrawal') {
        // Money leaving current account
        if (
          desc.includes('TRANSFER TO SAVINGS') ||
          desc.includes('TRANSFER TO') ||
          desc.includes('TO SAVINGS') ||
          desc.includes('TRANSACTION TO') ||
          desc.includes('TO **') ||
          desc.includes('BRANCH-TRANSACTION') ||
          (desc.includes('TRANSFER') && !desc.includes('SALARY'))
        ) {
          return { flowType: 'INTERNAL_TRANSFER', direction: 'debit' };
        }
        if (desc.includes('AUTOPAY') || desc.includes('CREDIT CARD PAYMENT') || desc.includes('CARD PAYMENT')) {
          return { flowType: 'DEBT_PAYMENT', direction: 'debit' };
        }
        return { flowType: 'EXPENSE', direction: 'debit' };
      } else if (columnType === 'deposit') {
        // Money entering current account
        if (desc.includes('SALARY') || desc.includes('SALARY CREDIT')) {
          return { flowType: 'INCOME', direction: 'credit' };
        }
        if (desc.includes('FREELANCE') || desc.includes('UPWORK') || desc.includes('CONSULTING')) {
          return { flowType: 'INCOME', direction: 'credit' };
        }
        if (desc.includes('TRANSFER FROM SAVINGS') || desc.includes('FROM SAVINGS') || desc.includes('FROM CURRENT')) {
          return { flowType: 'INTERNAL_TRANSFER', direction: 'credit' };
        }
        if (desc.includes('INTEREST') || desc.includes('CREDIT INTEREST') || desc.includes('ACCOUNT INTEREST')) {
          return { flowType: 'INTEREST_INCOME', direction: 'credit' };
        }
        if (desc.includes('BRANCH DEPOSIT') || desc.includes('CASH DEPOSIT')) {
          return { flowType: 'INCOME', direction: 'credit' };
        }
        return { flowType: 'INCOME', direction: 'credit' };
      }
    }

    // 2. Savings Account
    if (accountType === 'savings') {
      if (columnType === 'withdrawal') {
        // Money leaving savings
        if (desc.includes('TRANSFER TO CURRENT') || desc.includes('TRANSFER TO') || desc.includes('TO CURRENT')) {
          return { flowType: 'INTERNAL_TRANSFER', direction: 'debit' };
        }
        return { flowType: 'INTERNAL_TRANSFER', direction: 'debit' };
      } else if (columnType === 'deposit') {
        // Money entering savings
        if (desc.includes('CREDIT INTEREST') || desc.includes('INTEREST EARNED') || desc.includes('INTEREST')) {
          return { flowType: 'INTEREST_INCOME', direction: 'credit' };
        }
        if (desc.includes('TRANSFER FROM CURRENT') || desc.includes('TRANSFER FROM') || desc.includes('FROM CURRENT')) {
          return { flowType: 'INTERNAL_TRANSFER', direction: 'credit' };
        }
        return { flowType: 'INCOME', direction: 'credit' };
      }
    }

    // 3. Credit Card Account
    if (accountType === 'credit_card') {
      if (columnType === 'debit') {
        // In this statement, DEBIT column decreases the card liability (e.g. AUTOPAY RECEIVED - THANK YOU)
        if (desc.includes('AUTOPAY') || desc.includes('PAYMENT RECEIVED') || desc.includes('THANK YOU') || desc.includes('PAYMENT')) {
          return { flowType: 'DEBT_PAYMENT', direction: 'credit' }; // financial balance decrease
        }
        return { flowType: 'DEBT_PAYMENT', direction: 'credit' };
      } else if (columnType === 'credit') {
        // CREDIT column increases the credit card liability (purchases and interest)
        if (desc.includes('INTEREST CHARGED') || desc.includes('FINANCE CHARGE') || desc.includes('INTEREST')) {
          return { flowType: 'INTEREST_EXPENSE', direction: 'debit' };
        }
        // Merchant purchases
        return { flowType: 'EXPENSE', direction: 'debit' };
      }
    }

    // Fallback classification if unknown account
    if (columnType === 'withdrawal' || columnType === 'debit') {
      return { flowType: 'EXPENSE', direction: 'debit' };
    } else if (columnType === 'deposit' || columnType === 'credit') {
      return { flowType: 'INCOME', direction: 'credit' };
    }

    return { flowType: 'UNKNOWN', direction: 'debit' };
  }
}
