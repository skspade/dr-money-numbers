'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTransactions } from '@/hooks/useTransactions';
import { EditableAmountCell, EditableDateCell, EditableDescriptionCell, EditableNotesCell } from './EditableCells';
import { cn } from '@/lib/utils';

type EditableFields = 'amount' | 'date' | 'description' | 'notes';

export function TransactionTable() {
  const { transactions, isLoading, error, updateTransaction } = useTransactions();
  const [editingField, setEditingField] = useState<{id: string, field: EditableFields} | null>(null);

  // Handle saving edits
  const handleSaveEdit = async (id: string, field: EditableFields, value: any) => {
    try {
      // Create an update object with the field to update
      const updates = { [field]: value };
      await updateTransaction(id, updates);
    } catch (error) {
      console.error('Failed to update transaction:', error);
    } finally {
      setEditingField(null);
    }
  };

  if (isLoading && !transactions.length) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[40px] w-full" />
        <Skeleton className="h-[100px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">Error: {error.message}</div>
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
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell>
                <EditableDateCell
                  id={tx.id}
                  value={tx.date}
                  onSave={(id, value) => handleSaveEdit(id, 'date', value)}
                />
              </TableCell>
              <TableCell className="max-w-[300px]" title={tx.originalDescription}>
                <EditableDescriptionCell
                  id={tx.id}
                  value={tx.description}
                  onSave={(id, value) => handleSaveEdit(id, 'description', value)}
                />
              </TableCell>
              <TableCell className="text-right font-mono">
                <span className={tx.transactionType === 'debit' ? 'text-red-500' : 'text-green-500'}>
                  {tx.transactionType === 'debit' ? '-' : '+'}
                </span>
                <EditableAmountCell
                  id={tx.id}
                  value={tx.amount}
                  onSave={(id, value) => handleSaveEdit(id, 'amount', value)}
                />
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                    {
                      'bg-red-100 text-red-700': tx.transactionType === 'debit',
                      'bg-green-100 text-green-700': tx.transactionType === 'credit',
                      'bg-blue-100 text-blue-700': tx.transactionType === 'transfer',
                    },
                  )}
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
              <TableCell>
                <EditableNotesCell
                  id={tx.id}
                  value={tx.notes || null}
                  onSave={(id, value) => handleSaveEdit(id, 'notes', value)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
