import { z } from 'zod';
import { parseDollarAmount } from '@/lib/utils/transaction';

// Define transaction categories
export const TransactionCategory = z.enum([
  'INCOME', 'TRANSFER', 'HOUSING', 'TRANSPORT',
  'FOOD', 'SHOPPING', 'HEALTHCARE', 'ENTERTAINMENT',
  'EDUCATION', 'UTILITIES', 'BUSINESS', 'OTHER',
]);

// Define available tags
export const TransactionTag = z.enum([
  'essential', 'recurring', 'discretionary', 'subscription',
  'international', 'high_value', 'needs_review',
  'possible_fraud', 'refund', 'business_expense',
]);

// Define transaction types
export const TransactionType = z.enum([
  'debit', 'credit', 'transfer',
]);

// Custom error class for transaction processing
export class TransactionError extends Error {
  constructor(
    message: string,
    public code: string,
    public field?: string,
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

// Schema type exports
export type TransactionCategoryType = z.infer<typeof TransactionCategory>;
export type TransactionTagType = z.infer<typeof TransactionTag>;
export type TransactionTypeType = z.infer<typeof TransactionType>;

// Enhanced Transaction Schema
export const EnhancedTransactionSchema = z.object({
  // Core fields with improved validation
  amount: z.union([z.string(), z.number()])
    .transform((val) => {
      const parsed = parseDollarAmount(val);
      if (parsed === null) {
        throw new TransactionError(`Invalid money amount: ${val}`, 'INVALID_AMOUNT', 'amount');
      }
      return parsed;
    }),

  date: z.string()
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, {
      message: 'Invalid date format',
      path: ['date'],
    }),

  category: TransactionCategory,
  description: z.string().min(1, 'Description cannot be empty'),
  aiTags: z.array(TransactionTag),

  // New fields
  confidence: z.number().min(0).max(1),
  merchantId: z.string().optional(),
  recurringId: z.string().optional(),
  originalDescription: z.string(),
  notes: z.string().optional(),
  transactionType: TransactionType,

  // Metadata
  processingTimestamp: z.date().default(() => new Date()),
  schemaVersion: z.string().default('1.0.0'),
  source: z.string(),

  // Validation
  amountThreshold: z.object({
    isWithinLimits: z.boolean(),
    threshold: z.enum(['NORMAL', 'HIGH', 'VERY_HIGH']),
  }).optional(),
});

export type EnhancedTransaction = z.infer<typeof EnhancedTransactionSchema>;
