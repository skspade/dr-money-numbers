import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getDb } from "@/db";
import { getAuthOptionsWithDb } from "@/lib/auth";
import { transactions } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const authOptions = await getAuthOptionsWithDb();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const userTransactions = await db.select().from(transactions).where(
      sql`${transactions.userId} = ${session.user.id}`
    );
    return NextResponse.json(userTransactions);
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
} 