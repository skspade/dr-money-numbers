import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { transactions } from "@/db/schema";
import {  getFullAuthOptions } from "@/lib/auth";
import { desc } from "drizzle-orm";

export async function GET() {
  const authOptions = await getFullAuthOptions();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const userTransactions = await db.query.transactions.findMany({
      where: (transactions, { eq }) => eq(transactions.userId, session.user.id),
      orderBy: [desc(transactions.date)],
    });

    return NextResponse.json(userTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
} 