import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { transactions, categories } from '@/db/schema';
import { auth } from '@/lib/auth';
import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { dollarsToCents } from '@/lib/utils/money';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { TransactionProcessor } from '@/lib/utils/transaction';
import { EnhancedTransactionSchema } from '@/types/transaction';
import type { EnhancedTransaction, TransactionCategoryType, TransactionTagType } from '@/types/transaction';

// Define the shape of raw transaction data from AI
interface RawTransaction {
  amount: number;
  date: string;
  description: string;
  originalDescription: string;
  category: TransactionCategoryType;
  transactionType: 'debit' | 'credit' | 'transfer';
  aiTags: TransactionTagType[];
  confidence: number;
  merchantId?: string;
  recurringId?: string;
  notes?: string;
  source: string;
  processingTimestamp: string;
  schemaVersion: string;
  amountThreshold?: {
    isWithinLimits: boolean;
    threshold: 'NORMAL' | 'HIGH' | 'VERY_HIGH';
  };
}

// Define the shape of our database transaction insert
interface DbTransaction {
  userId: string;
  categoryId: string;
  amount: number;
  date: Date;
  description: string;
  aiTags: TransactionTagType[];
  confidence: number;
  merchantId: string | null;
  recurringId: string | null;
  originalDescription: string;
  notes: string | null;
  transactionType: 'debit' | 'credit' | 'transfer';
  schemaVersion: string;
  source: string;
  amountThreshold: 'NORMAL' | 'HIGH' | 'VERY_HIGH';
  isWithinLimits: boolean;
}

// Type guard for TransactionCategoryType
function isTransactionCategory(value: unknown): value is TransactionCategoryType {
  return typeof value === 'string' && [
    'INCOME', 'TRANSFER', 'HOUSING', 'TRANSPORT',
    'FOOD', 'SHOPPING', 'HEALTHCARE', 'ENTERTAINMENT',
    'EDUCATION', 'UTILITIES', 'BUSINESS', 'OTHER',
  ].includes(value);
}

// Type guard for transaction threshold
function isValidThreshold(value: unknown): value is 'NORMAL' | 'HIGH' | 'VERY_HIGH' {
  return typeof value === 'string' && ['NORMAL', 'HIGH', 'VERY_HIGH'].includes(value);
}

function validateTransactionDate(date: unknown): Date {
  if (typeof date === 'string') {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
 return d;
}
  }
  if (date instanceof Date) {
 return date;
}
  throw new Error(`Invalid transaction date: ${JSON.stringify(date)}`);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { csvData } = await req.json();

    if (!csvData) {
      return NextResponse.json({ error: 'No CSV data provided' }, { status: 400 });
    }

    // Create the prompt with the CSV data
    const prompt = `You are a specialized banking transaction categorization agent. Your role is to analyze banking transactions and output structured data matching a specific enhanced schema.

# Core Schema Requirements

Each transaction must include these required fields:
- amount: Parsed number (from string or number input)
- date: Valid date string
- category: One of the enumerated categories
- description: Cleaned merchant/transaction description
- aiTags: Array of valid tags
- originalDescription: Raw unmodified description
- transactionType: "debit", "credit", or "transfer"
- source: Data source identifier
- confidence: Number between 0-1
- processingTimestamp: Current timestamp
- schemaVersion: "1.0.0"

Optional fields:
- merchantId: Normalized merchant identifier
- recurringId: ID for recurring transaction groups
- notes: Additional context
- amountThreshold: Validation object for amount limits

# Enumerated Values

## Categories (Exactly ONE required)
- INCOME: Salary, deposits, investment returns
- TRANSFER: Account transfers, credit card payments
- HOUSING: Rent, mortgage, utilities
- TRANSPORT: Gas, car payments, public transit
- FOOD: Groceries, restaurants, delivery
- SHOPPING: Retail, online purchases
- HEALTHCARE: Medical, pharmacy, insurance
- ENTERTAINMENT: Streaming, events, hobbies
- EDUCATION: Tuition, courses, materials
- UTILITIES: Power, water, internet, phone
- BUSINESS: Work expenses, professional services
- OTHER: Transactions not fitting other categories

## Transaction Tags (Multiple allowed)
- essential: Basic living expenses
- recurring: Regular monthly payments
- discretionary: Optional/luxury purchases
- subscription: Regular service fees
- international: Foreign transactions
- high_value: Transactions above typical amount
- needs_review: Uncertain categorization
- possible_fraud: Suspicious patterns
- refund: Return or reimbursement
- business_expense: Work-related costs

## Transaction Types
- debit: Money spent/leaving account
- credit: Money received/entering account
- transfer: Money moved between accounts

# Processing Rules

## Amount Processing
- Convert all amounts to standardized number format
- Set transaction type based on amount sign
- Apply amount thresholds:
  - NORMAL: < $1,000
  - HIGH: $1,000 - $5,000
  - VERY_HIGH: > $5,000

## Merchant Standardization
1. Clean description:
   - Remove transaction IDs
   - Remove location numbers
   - Remove payment processor prefixes

2. Generate merchantId:
   - Convert to uppercase
   - Remove special characters
   - Apply known merchant mappings

3. Recurring Detection:
   - Generate recurringId for similar transactions
   - Pattern: {merchantId}-{amount}-{frequency}

# Confidence Score Guidelines

Assign confidence scores based on:
1. Description clarity (0.1-0.3)
   - Clear merchant name: +0.3
   - Ambiguous description: +0.1
   
2. Category certainty (0.1-0.3)
   - Clear category match: +0.3
   - Multiple possible categories: +0.1
   
3. Amount pattern (0.1-0.2)
   - Typical amount for category: +0.2
   - Unusual amount: +0.1
   
4. Merchant recognition (0.1-0.2)
   - Known merchant: +0.2
   - Unknown merchant: +0.1

When confidence < 0.7, add "needs_review" tag.

CSV Data to Parse:
${csvData}

Remember to:
1. Maintain schema version compatibility
2. Generate consistent merchantIds
3. Set appropriate confidence scores
4. Include relevant validation flags
5. Add explanatory notes for unusual cases`;

    // AI Processing
    try {
      const aiResponse = await generateObject({
        model: anthropic('claude-3-5-haiku-20241022'),
        output: 'array',
        schema: EnhancedTransactionSchema,
        prompt,
      });

      if (!Array.isArray(aiResponse.object)) {
        throw new Error('AI response is not an array of transactions');
      }

      if (aiResponse.object.length === 0) {
        throw new Error('AI response contains no transactions');
      }

      const rawTransactions = aiResponse.object as unknown as RawTransaction[];
      console.log('AI Response:', JSON.stringify(rawTransactions, null, 2));

      const processor = new TransactionProcessor();
      const processedTransactions = rawTransactions.map((transaction) => {
        const input = {
          raw_amount: transaction.amount,
          raw_date: new Date(transaction.date).toISOString(),
          raw_description: transaction.description,
          source: transaction.source,
        };
        return processor.process(input);
      });

      const db = await getDb();

      // Get unique categories from transactions
      const uniqueCategories = [...new Set(processedTransactions.map((tx) => tx.category))]
        .filter(isTransactionCategory);

      // Create a map to store category names to IDs
      const categoryMap = new Map<TransactionCategoryType, string>();

      // For each unique category
      for (const categoryName of uniqueCategories) {
        // Check if category exists
        const existingCategory = await db.select()
          .from(categories)
          .where(
            and(
              eq(categories.userId, session.user.id),
              eq(categories.name, categoryName),
            ),
          )
          .limit(1);

        if (existingCategory.length > 0) {
          // If exists, use existing ID
          categoryMap.set(categoryName, existingCategory[0].id);
        } else {
          // If doesn't exist, create new category
          const newCategoryId = createId();
          await db.insert(categories).values({
            id: newCategoryId,
            userId: session.user.id,
            name: categoryName,
            target: 0, // Default target
            frequency: 'MONTHLY', // Default frequency
            available: 0, // Default available amount
          });
          categoryMap.set(categoryName, newCategoryId);
        }
      }

      // Now insert transactions with proper category IDs
      const dbTransactions: DbTransaction[] = processedTransactions.map((tx: EnhancedTransaction) => {
        // Validate and get category
        const category = tx.category;
        if (!isTransactionCategory(category)) {
          throw new Error(`Invalid category: ${category}`);
        }

        // Get category ID
        const categoryId = categoryMap.get(category);
        if (!categoryId) {
          throw new Error(`No category ID found for: ${category}`);
        }

        // Handle amount threshold with proper type checking
        const amountThreshold = tx.amountThreshold && typeof tx.amountThreshold === 'object' && 'threshold' in tx.amountThreshold
          ? isValidThreshold(tx.amountThreshold.threshold)
            ? tx.amountThreshold.threshold
            : 'NORMAL'
          : 'NORMAL';

        // Ensure we have a valid date
        const date = validateTransactionDate(tx.date);

        // Handle optional fields with proper type checking
        const merchantId = typeof tx.merchantId === 'string' ? tx.merchantId : null;
        const recurringId = typeof tx.recurringId === 'string' ? tx.recurringId : null;
        const notes = typeof tx.notes === 'string' ? tx.notes : null;
        const isWithinLimits = tx.amountThreshold && typeof tx.amountThreshold === 'object' && 'isWithinLimits' in tx.amountThreshold
          ? Boolean(tx.amountThreshold.isWithinLimits)
          : true;

        return {
          userId: session.user.id,
          amount: dollarsToCents(Number(tx.amount)),
          date,
          categoryId,
          description: String(tx.description),
          aiTags: tx.aiTags as TransactionTagType[],
          confidence: Number(tx.confidence),
          merchantId,
          recurringId,
          originalDescription: String(tx.originalDescription),
          notes,
          transactionType: tx.transactionType as 'debit' | 'credit' | 'transfer',
          schemaVersion: String(tx.schemaVersion),
          source: String(tx.source),
          amountThreshold,
          isWithinLimits,
        };
      });

      const inserted = await db.insert(transactions)
        .values(dbTransactions)
        .returning();

      return NextResponse.json({
        message: 'Transactions processed successfully',
        count: inserted.length,
        transactions: inserted,
      });
    } catch (aiError) {
      console.error('AI Processing Error:', aiError);
      return NextResponse.json({
        error: 'Failed to process transactions with AI',
        details: aiError instanceof Error ? aiError.message : 'Unknown error',
      }, { status: 422 });
    }
  } catch (error) {
    console.error('CSV Processing Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process CSV' },
      { status: 500 },
    );
  }
}
