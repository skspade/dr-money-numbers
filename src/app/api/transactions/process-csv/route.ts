import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { transactions } from "@/db/schema";
import { auth } from "@/lib/auth";

type ParsedTransaction = {
  amount: number;
  date: string;
  categoryId: string;
  description: string;
  aiTags: string[];
};

export const runtime = "edge";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { csvData } = await req.json();
    
    const headers: HeadersInit = {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.VERCEL_URL ?? "http://localhost:3000",
      "Content-Type": "application/json",
    };

    if (process.env.OPENROUTER_ORG_ID) {
      headers["OR-ORGANIZATION"] = process.env.OPENROUTER_ORG_ID;
    }
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [{
          role: "system",
          content: `Parse this CSV transaction data into structured JSON format:
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
          }`
        }, {
          role: "user",
          content: csvData
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to process CSV with AI');
    }

    const result = await response.json();
    const parsedTransactions = JSON.parse(result.choices[0].message.content) as ParsedTransaction[];
    
    // Insert into database
    const db = await getDb();
    const inserted = await db.insert(transactions).values(
      parsedTransactions.map((tx) => ({
        userId: session.user.id,
        amount: tx.amount,
        date: new Date(tx.date),
        categoryId: tx.categoryId,
        description: tx.description,
        aiTags: tx.aiTags
      }))
    ).returning();

    return NextResponse.json(inserted);
  } catch (error) {
    console.error("CSV Processing Error:", error);
    return NextResponse.json(
      { error: "Failed to process CSV" },
      { status: 500 }
    );
  }
} 