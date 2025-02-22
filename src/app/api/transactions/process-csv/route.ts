import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { transactions, categories } from '@/db/schema';
import { auth } from '@/lib/auth';
import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';
import { dollarsToCents, parseDollarAmount } from '@/lib/utils/money';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

const ParsedTransactionSchema = z.object({
  amount: z.union([z.string(), z.number()]).transform((val) => {
    const parsed = parseDollarAmount(val);
    if (parsed === null) {
      throw new Error(`Invalid money amount: ${val}`);
    }
    return parsed;
  }),
  date: z.string(),
  category: z.string(),
  description: z.string(),
  aiTags: z.array(z.string()),
});

type ParsedTransaction = z.infer<typeof ParsedTransactionSchema>;

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

    // AI Processing
    const aiResponse = await generateObject({
      model: anthropic('claude-3-5-haiku-20241022'),
      output: 'array',
      schema: ParsedTransactionSchema,
      prompt: `Parse the following CSV transaction data into structured JSON format. Each row should be converted into a separate object in the array. Normalize category names to be uppercase with underscores (e.g., "ATM Fee" becomes "ATM_FEE"):
      ${csvData}`,
    });

    let parsedTransactions: ParsedTransaction[];
    try {
      if (!Array.isArray(aiResponse.object)) {
        throw new Error('Expected array response from AI');
      }

      parsedTransactions = aiResponse.object.map((transaction) => {
        const result = ParsedTransactionSchema.safeParse(transaction);
        if (!result.success) {
          throw new Error(`Invalid transaction data: ${result.error}`);
        }
        return result.data;
      });
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json(
        { error: 'Invalid AI response format' },
        { status: 500 },
      );
    }

    const db = await getDb();

    // Get unique categories from transactions
    const uniqueCategories = [...new Set(parsedTransactions.map((tx) => tx.category))];

    // Create a map to store category names to IDs
    const categoryMap = new Map<string, string>();

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
    const inserted = await db.insert(transactions).values(
      parsedTransactions.map((tx) => ({
        userId: session.user.id,
        amount: dollarsToCents(tx.amount),
        date: new Date(tx.date),
        categoryId: categoryMap.get(tx.category)!, // Use ! since we know the category exists
        description: tx.description,
        aiTags: tx.aiTags,
      })),
    ).returning();

    return NextResponse.json(inserted);
  } catch (error) {
    console.error('CSV Processing Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process CSV' },
      { status: 500 },
    );
  }
}
