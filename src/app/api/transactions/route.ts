import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDb } from '@/db';
import { getAuthOptionsWithDb } from '@/lib/auth';
import { transactions } from '@/db/schema';
import { sql, eq, and } from 'drizzle-orm';
import { z } from 'zod';

export async function GET() {
  const authOptions = await getAuthOptionsWithDb();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = await getDb();
    const userTransactions = await db.select().from(transactions).where(
      sql`${transactions.userId} = ${session.user.id}`,
    );
    return NextResponse.json(userTransactions);
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const authOptions = await getAuthOptionsWithDb();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, ...updates } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 },
      );
    }

    // Validate that this transaction belongs to the current user
    const db = await getDb();
    const existingTransaction = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.id, id),
        eq(transactions.userId, session.user.id),
      ),
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 },
      );
    }

    // Update the transaction
    const updatedTransaction = await db
      .update(transactions)
      .set(updates)
      .where(
        and(
          eq(transactions.id, id),
          eq(transactions.userId, session.user.id),
        ),
      )
      .returning();

    return NextResponse.json(updatedTransaction[0]);
  } catch (error) {
    console.error('Failed to update transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 },
    );
  }
}
