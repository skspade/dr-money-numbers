"use server";

import { db } from "@/db";
import { categories } from "@/db/schema";
import { auth } from "@/lib/auth";
import { BudgetAllocation } from "@/lib/types/budget";
import { and, eq } from "drizzle-orm";

export async function saveBudgetAllocation(allocation: Omit<BudgetAllocation, "id" | "userId">) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // First, check if a category with this name already exists for the user
  const existingCategories = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.userId, session.user.id),
        eq(categories.name, allocation.category)
      )
    );

  if (existingCategories.length > 0) {
    // Update existing category
    await db
      .update(categories)
      .set({
        target: allocation.amount,
        frequency: allocation.frequency,
        available: allocation.available,
      })
      .where(eq(categories.id, existingCategories[0].id));
    
    return existingCategories[0].id;
  } else {
    // Create new category
    const [newCategory] = await db
      .insert(categories)
      .values({
        userId: session.user.id,
        name: allocation.category,
        target: allocation.amount,
        frequency: allocation.frequency,
        available: allocation.available,
      })
      .returning();

    return newCategory.id;
  }
} 