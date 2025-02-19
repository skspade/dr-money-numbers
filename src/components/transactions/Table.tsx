"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  categoryId: string;
  aiTags?: string[];
};

export function TransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/transactions');
        if (!response.ok) throw new Error('Failed to fetch transactions');
        const data = await response.json();
        setTransactions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (isLoading) {
    return <div className="space-y-4">
      <Skeleton className="h-[40px] w-full" />
      <Skeleton className="h-[100px] w-full" />
    </div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Tags</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => (
          <TableRow key={tx.id}>
            <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
            <TableCell>{tx.description}</TableCell>
            <TableCell>${(tx.amount / 100).toFixed(2)}</TableCell>
            <TableCell>{tx.categoryId}</TableCell>
            <TableCell>{tx.aiTags?.join(", ")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 