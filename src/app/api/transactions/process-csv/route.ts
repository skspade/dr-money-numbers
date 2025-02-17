import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { transactions } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

type ParsedTransaction = {
  amount: number;
  date: string;
  categoryId: string;
  description: string;
  aiTags: string[];
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { csvData } = await req.json();
    
    // Process with AI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
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
    });

    const parsedTransactions = JSON.parse(completion.choices[0].message.content) as ParsedTransaction[];
    
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