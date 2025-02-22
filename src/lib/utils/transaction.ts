import { TransactionError, EnhancedTransactionSchema } from '@/types/transaction';
import type { EnhancedTransaction } from '@/types/transaction';

/**
 * Parses a dollar amount from either a string or number input
 * @param val The input value to parse
 * @returns The parsed amount as a number, or null if invalid
 */
export const parseDollarAmount = (val: string | number): number | null => {
  // If already a number, validate and return
  if (typeof val === 'number') {
    return isFinite(val) ? val : null;
  }

  // Clean string and parse
  const cleaned = val.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);

  return isFinite(parsed) ? parsed : null;
};

/**
 * Generates a merchant ID from a transaction description
 * @param description The transaction description
 * @returns A normalized merchant ID
 */
export const generateMerchantId = (description: string): string => description
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 50);

/**
 * Calculates a confidence score for a transaction based on its properties
 * @param transaction The transaction to evaluate
 * @returns A confidence score between 0 and 1
 */
export const calculateConfidence = (transaction: Partial<EnhancedTransaction>): number => {
  let score = 0;

  // Description clarity (0.1-0.3)
  score += transaction.description && transaction.description.length > 3 ? 0.3 : 0.1;

  // Category certainty (0.1-0.3)
  score += transaction.category !== 'OTHER' ? 0.3 : 0.1;

  // Amount pattern (0.1-0.2)
  score += (transaction.amount !== undefined && Math.abs(transaction.amount) < 1000) ? 0.2 : 0.1;

  // Merchant recognition (0.1-0.2)
  score += transaction.merchantId ? 0.2 : 0.1;

  return Math.min(score, 1);
};

/**
 * Determines the threshold category for a transaction amount
 * @param amount The transaction amount
 * @returns The threshold category
 */
export const getAmountThreshold = (amount: number): 'NORMAL' | 'HIGH' | 'VERY_HIGH' => {
  const absAmount = Math.abs(amount);
  if (absAmount > 5000) {
 return 'VERY_HIGH';
}
  if (absAmount > 1000) {
 return 'HIGH';
}
  return 'NORMAL';
};

/**
 * Cleans and normalizes a transaction description
 * @param description The raw description
 * @returns A cleaned description
 */
export const cleanDescription = (description: string): string =>
   description
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphen
    .slice(0, 100) // Limit length
;

/**
 * Main transaction processor class
 */
export class TransactionProcessor {
  /**
   * Processes a raw transaction into an enhanced transaction
   * @param rawTransaction The raw transaction data
   * @returns An enhanced transaction
   * @throws {TransactionError} If processing fails
   */
  process(rawTransaction: any): EnhancedTransaction {
    try {
      // Basic validation
      if (!rawTransaction.raw_amount || !rawTransaction.raw_date || !rawTransaction.raw_description) {
        throw new TransactionError(
          'Missing required fields',
          'MISSING_FIELDS',
          Object.entries(rawTransaction)
            .filter(([_, v]) => !v)
            .map(([k]) => k)
            .join(', '),
        );
      }

      // Process amount
      const amount = parseDollarAmount(rawTransaction.raw_amount);
      if (amount === null) {
        throw new TransactionError(
          `Invalid amount: ${rawTransaction.raw_amount}`,
          'INVALID_AMOUNT',
          'raw_amount',
        );
      }

      // Generate merchant details
      const merchantId = generateMerchantId(rawTransaction.raw_description);

      // Create base transaction
      const transaction: Partial<EnhancedTransaction> = {
        amount,
        date: rawTransaction.raw_date,
        description: cleanDescription(rawTransaction.raw_description),
        originalDescription: rawTransaction.raw_description,
        merchantId,
        transactionType: amount > 0 ? 'credit' : 'debit',
        source: rawTransaction.source || 'unknown',
        category: 'OTHER', // Default category, should be determined by AI
        aiTags: [], // Should be determined by AI
      };

      // Add derived fields
      transaction.confidence = calculateConfidence(transaction);
      transaction.amountThreshold = {
        isWithinLimits: Math.abs(amount) <= 5000,
        threshold: getAmountThreshold(amount),
      };

      // Validate and return
      return EnhancedTransactionSchema.parse(transaction);
    } catch (error) {
      if (error instanceof TransactionError) {
        throw error;
      }
      throw new TransactionError(
        error instanceof Error ? error.message : 'Unknown error during transaction processing',
        'PROCESSING_ERROR',
      );
    }
  }
}
