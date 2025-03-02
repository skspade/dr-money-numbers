import { useState, useCallback, useEffect } from 'react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  originalDescription: string;
  amount: number;
  transactionType: 'debit' | 'credit' | 'transfer';
  categoryId: string;
  merchantId?: string | null;
  aiTags: string[];
  notes?: string | null;
}

export interface UseTransactionsReturn {
  transactions: Transaction[];
  isLoading: boolean;
  error: Error | null;
  addTransaction: (_transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (_id: string) => Promise<void>;
  updateTransaction: (_id: string, _updates: Partial<Transaction>) => Promise<Transaction>;
  fetchTransactions: () => Promise<void>;
}

export function useTransactions(): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/transactions', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load transactions'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch transactions on mount
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = useCallback(async (_transaction: Omit<Transaction, 'id'>) => {
    // Implementation coming soon
  }, []);

  const deleteTransaction = useCallback(async (_id: string) => {
    // Implementation coming soon
  }, []);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update transaction');
      }

      const updatedTransaction = await response.json();

      // Update the local state with the updated transaction
      setTransactions((prevTransactions) =>
        prevTransactions.map((tx) =>
          tx.id === id ? { ...tx, ...updatedTransaction } : tx,
        ),
      );

      return updatedTransaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update transaction';
      setError(new Error(errorMessage));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    transactions,
    isLoading,
    error,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    fetchTransactions,
  };
}
