import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { transactions } from '@/db/schema';
import { auth } from '@/lib/auth';
import { togetherai } from '@ai-sdk/togetherai';
type ParsedTransaction = {
  amount: number;
  date: string;
  categoryId: string;
  description: string;
  aiTags: string[];
};

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
    // @ts-ignore - togetherai types are not fully compatible with the current version
    const { text: aiResponse } = await togetherai.generateText({
      model: togetherai('mistralai/Mistral-7B-Instruct-v0.3'),
      system: `Parse this CSV transaction data into structured JSON format:
      - Convert dates to ISO format
      - Categorize transactions into: 'income', 'expense', 'transfer'
      - Detect payment methods
      - Add relevant tags
      Respond ONLY with valid JSON array of objects with fields:
      {
        amount: number (in cents),
        date: string (ISO format),
        categoryId: string,
        description: string,
        aiTags: string[]
      }`,
      messages: [{
        role: 'user',
        content: csvData,
      }],
    });

    let parsedTransactions: ParsedTransaction[];

    try {
      parsedTransactions = JSON.parse(aiResponse) as ParsedTransaction[];
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json(
        { error: 'Invalid AI response format' },
        { status: 500 },
      );
    }

    // Insert into database
    const db = await getDb();
    const inserted = await db.insert(transactions).values(
      parsedTransactions.map((tx) => ({
        userId: session.user.id,
        amount: tx.amount,
        date: new Date(tx.date),
        categoryId: tx.categoryId,
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
