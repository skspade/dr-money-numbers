'use server';

import { getDb } from '@/db';
import { categories, userBudget } from '@/db/schema';
import { auth } from '@/lib/auth';
import { BudgetAllocation } from '@/lib/types/budget';
import { and, eq } from 'drizzle-orm';
import { dollarsToCents, centsToDollars } from '@/lib/utils/money';

export async function saveBudgetAllocation(allocation: Omit<BudgetAllocation, 'id' | 'userId'>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }

    const db = await getDb();

    // Convert amounts to cents
    const targetAmount = dollarsToCents(allocation.amount);
    const availableAmount = dollarsToCents(allocation.available);

    // First, check if a category with this name already exists for the user
    const existingCategories = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.userId, session.user.id),
          eq(categories.name, allocation.category),
        ),
      );

    if (existingCategories.length > 0) {
      // Update existing category
      const [updated] = await db
        .update(categories)
        .set({
          target: targetAmount,
          frequency: allocation.frequency,
          available: availableAmount,
        })
        .where(eq(categories.id, existingCategories[0].id))
        .returning();

      return updated.id;
    } else {
      // Create new category
      const [newCategory] = await db
        .insert(categories)
        .values({
          userId: session.user.id,
          name: allocation.category,
          target: targetAmount,
          frequency: allocation.frequency,
          available: availableAmount,
        })
        .returning();

      return newCategory.id;
    }
  } catch (error) {
    console.error('Failed to save budget allocation:', {
      error,
      allocation,
      userId: (await auth())?.user?.id,
    });
    throw new Error(error instanceof Error ? error.message : 'Failed to save budget allocation');
  }
}

export async function loadBudgetAllocations() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }

    const db = await getDb();

    // Load user's budget settings
    const [budgetSettings] = await db
      .select()
      .from(userBudget)
      .where(eq(userBudget.userId, session.user.id));

    // Load categories
    const userCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, session.user.id));

    return {
      totalIncome: budgetSettings?.monthlyIncome ? centsToDollars(budgetSettings.monthlyIncome) : 0,
      targetSavings: budgetSettings?.targetSavings ? centsToDollars(budgetSettings.targetSavings) : 0,
      allocations: userCategories.map((category) => ({
        id: category.id,
        userId: category.userId,
        category: category.name,
        amount: centsToDollars(category.target),
        frequency: category.frequency,
        allocated: centsToDollars(category.target),
        spent: 0,
        available: centsToDollars(category.available),
      })),
    };
  } catch (error) {
    console.error('Failed to load budget:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to load budget');
  }
}

export async function saveBudgetSettings({ monthlyIncome, targetSavings }: { monthlyIncome: number; targetSavings: number }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }

    const db = await getDb();

    // Convert to cents using our utility
    const incomeInCents = dollarsToCents(monthlyIncome);
    const savingsInCents = dollarsToCents(targetSavings);

    // Upsert budget settings
    await db
      .insert(userBudget)
      .values({
        userId: session.user.id,
        monthlyIncome: incomeInCents,
        targetSavings: savingsInCents,
      })
      .onConflictDoUpdate({
        target: [userBudget.userId],
        set: {
          monthlyIncome: incomeInCents,
          targetSavings: savingsInCents,
        },
      });
  } catch (error) {
    console.error('Failed to save budget settings:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to save budget settings');
  }
}
