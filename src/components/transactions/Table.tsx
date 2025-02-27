'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Transaction = {
  id: string;
  date: string;
  description: string;
  originalDescription: string;
  amount: number;
  transactionType: 'debit' | 'credit' | 'transfer';
  categoryId: string;
  merchantId?: string | null;
  aiTags: string[];
};

export function TransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/transactions', {
          credentials: 'include', // Include credentials for authentication
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Please sign in to view transactions');
          }
          throw new Error('Failed to fetch transactions');
        }

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
    return (
      <div className="space-y-4">
        <Skeleton className="h-[40px] w-full" />
        <Skeleton className="h-[100px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">Error: {error}</div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No transactions found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
              <TableCell className="max-w-[300px] truncate" title={tx.originalDescription}>
                {tx.description}
              </TableCell>
              <TableCell className="text-right font-mono">
                <span className={tx.transactionType === 'debit' ? 'text-red-500' : 'text-green-500'}>
                  {tx.transactionType === 'debit' ? '-' : '+'}
                </span>
                ${(Math.abs(tx.amount) / 100).toFixed(2)}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
                  ${tx.transactionType === 'debit' ? 'bg-red-100 text-red-700' :
                    tx.transactionType === 'credit' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'}`}
                >
                  {tx.transactionType}
                </span>
              </TableCell>
              <TableCell>{tx.categoryId}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {tx.aiTags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
