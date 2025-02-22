'use server';

import { getDb } from '@/db';
import { categories, transactions } from '@/db/schema';
import { BudgetAllocation } from '@/lib/types/budget';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function upsertCategory(
  userId: string,
  allocation: BudgetAllocation,
) {
  try {
    const db = await getDb();
    await db.insert(categories).values({
      id: allocation.id,
      userId,
      name: allocation.category,
      target: allocation.target?.amount || 0,
      frequency: allocation.target?.type === 'monthly' ? 'MONTHLY' : 'WEEKLY',
      available: allocation.available,
    }).onConflictDoUpdate({
      target: categories.id,
      set: {
        target: allocation.target?.amount || 0,
        available: allocation.available,
      },
    });

    revalidatePath('/dashboard/budget');
    return { success: true };
  } catch (error) {
    console.error('Failed to upsert category:', error);
    return { success: false, error };
  }
}

export async function updateSpending(
  userId: string,
  categoryId: string,
  amount: number,
) {
  try {
    const db = await getDb();
    // Create a transaction record
    await db.insert(transactions).values({
      userId,
      categoryId,
      amount,
      date: new Date(),
    });

    // Update the category's available amount
    const category = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (category.length > 0) {
      await db
        .update(categories)
        .set({
          available: category[0].available - amount,
        })
        .where(eq(categories.id, categoryId));
    }

    revalidatePath('/dashboard/budget');
    return { success: true };
  } catch (error) {
    console.error('Failed to update spending:', error);
    return { success: false, error };
  }
}

export async function getCategories(userId: string) {
  try {
    const db = await getDb();
    const userCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId));

    return { success: true, data: userCategories };
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return { success: false, error };
  }
}

export async function getTransactions(userId: string, categoryId?: string) {
  try {
    const db = await getDb();
    const conditions = [eq(transactions.userId, userId)];
    if (categoryId) {
      conditions.push(eq(transactions.categoryId, categoryId));
    }

    const userTransactions = await db
      .select()
      .from(transactions)
      .where(and(...conditions));

    return { success: true, data: userTransactions };
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return { success: false, error };
  }
}
