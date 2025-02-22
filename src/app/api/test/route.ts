import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { users, categories, transactions, transactionTypeEnum, amountThresholdEnum } from '@/db/schema';
import { createId } from '@paralleldrive/cuid2';
import { dollarsToCents } from '@/lib/utils/money';
import type { TransactionTagType } from '@/types/transaction';

export async function GET() {
  try {
    const db = await getDb();

    // Create a test user
    const userId = createId();
    await db.insert(users).values({
      id: userId,
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
    });

    // Create a test category
    const categoryId = createId();
    await db.insert(categories).values({
      id: categoryId,
      userId: userId,
      name: 'GROCERIES',
      target: dollarsToCents(500), // $500 budget
      frequency: 'MONTHLY',
      available: dollarsToCents(500), // Full amount available
    });

    // Create a test transaction with all new fields
    const transactionId = createId();
    const testTransaction = {
      id: transactionId,
      userId: userId,
      categoryId: categoryId,
      amount: dollarsToCents(42.99), // $42.99
      date: new Date(),
      description: 'Whole Foods Market - Weekly Groceries',
      originalDescription: 'WHOLE FOODS MKT #123 BERKELEY CA',
      aiTags: ['essential', 'recurring'] as TransactionTagType[],

      // New fields
      confidence: 0.85,
      merchantId: 'WHOLEFOODSMARKET',
      recurringId: 'WEEKLY_GROCERY_WHOLEFOODSMARKET',
      notes: 'Weekly grocery shopping',
      transactionType: 'debit' as const,

      // Metadata
      schemaVersion: '1.0.0',
      source: 'test',

      // Validation
      amountThreshold: 'NORMAL' as const,
      isWithinLimits: true,
    };

    const inserted = await db.insert(transactions)
      .values(testTransaction)
      .returning();

    return NextResponse.json({
      message: 'Test data created successfully',
      user: { id: userId },
      category: { id: categoryId },
      transaction: inserted[0],
    });
  } catch (error) {
    console.error('Test Data Creation Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create test data' },
      { status: 500 },
    );
  }
}
