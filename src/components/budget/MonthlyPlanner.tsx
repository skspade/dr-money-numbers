'use client';

import { useEffect, useState, ChangeEvent, useRef, useCallback } from 'react';
import { useBudget } from '@/hooks/useBudget';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { saveBudgetAllocation, loadBudgetAllocations, saveBudgetSettings } from '@/app/actions/budget';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

const DEFAULT_CATEGORIES = [
  'Housing',
  'Transportation',
  'Food',
  'Utilities',
  'Healthcare',
  'Entertainment',
  'Savings',
] as const;

interface MonthlyPlannerProps {
  userId: string;
}

export function MonthlyPlanner({ userId }: MonthlyPlannerProps) {
  const { state, dispatch } = useBudget({ userId });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [allocationAmount, setAllocationAmount] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const isFirstLoad = useRef(true);
  const { status } = useSession();

  useEffect(() => {
    const loadBudget = async () => {
      if (!isFirstLoad.current || status !== 'authenticated') {
 return;
}

      try {
        const budget = await loadBudgetAllocations();

        // Set the entire initial state at once
        dispatch({
          type: 'SET_INITIAL_STATE',
          state: {
            totalIncome: budget.totalIncome,
            targetSavings: budget.targetSavings,
            allocations: budget.allocations,
          },
        });

        isFirstLoad.current = false;
      } catch (error) {
        console.error('Failed to load budget:', error);
        setError(error instanceof Error ? error.message : 'Failed to load budget');
      } finally {
        setIsInitialLoading(false);
      }
    };

    if (userId) {
      loadBudget();
    }
  }, [userId, dispatch, status]);

  const handleIncomeChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const newIncome = parseFloat(e.target.value) || 0;

    try {
      // Save to database first
      await saveBudgetSettings({
        monthlyIncome: newIncome,
        targetSavings: state.targetSavings,
      });

      // Only update local state if save was successful
      dispatch({ type: 'SET_INCOME', amount: newIncome });
    } catch (error) {
      console.error('Failed to save income:', error);
      setError('Failed to save income. Your changes may not persist.');
    }
  };

  const handleSavingsChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const newSavings = parseFloat(e.target.value) || 0;

    try {
      // Save to database first
      await saveBudgetSettings({
        monthlyIncome: state.totalIncome,
        targetSavings: newSavings,
      });

      // Only update local state if save was successful
      dispatch({ type: 'SET_SAVINGS', amount: newSavings });
    } catch (error) {
      console.error('Failed to save savings target:', error);
      setError('Failed to save savings target. Your changes may not persist.');
    }
  };

  const handleAllocationSubmit = async () => {
    const amount = parseFloat(allocationAmount);
    if (!selectedCategory || isNaN(amount) || !state.userId) {
      setError('Please enter a valid category and amount');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const allocationId = await saveBudgetAllocation({
        category: selectedCategory,
        amount,
        frequency: 'MONTHLY',
        allocated: amount,
        spent: 0,
        available: amount,
      });

      if (!allocationId) {
        throw new Error('Failed to save allocation - no ID returned');
      }

      dispatch({
        type: 'ADD_ALLOCATION',
        allocation: {
          id: allocationId,
          userId: state.userId,
          category: selectedCategory,
          amount,
          frequency: 'MONTHLY',
          allocated: amount,
          spent: 0,
          available: amount,
        },
      });

      setSelectedCategory('');
      setAllocationAmount('');
    } catch (error) {
      console.error('Failed to save allocation:', error);
      setError(error instanceof Error ? error.message : 'Failed to save allocation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSuggestions = useCallback(async () => {
    if (!state.userId) {
 return;
}

    try {
      const response = await fetch('/api/budget/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          income: state.totalIncome,
          savings: state.targetSavings,
          allocations: state.allocations,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  }, [state.totalIncome, state.targetSavings, state.allocations, state.userId]);

  useEffect(() => {
    if (state.userId) {
      updateSuggestions();
    }
  }, [state.userId, updateSuggestions]);

  const progress = state.totalIncome > 0 ? ((state.totalIncome - state.unallocated) / state.totalIncome * 100) : 0;

  if (isInitialLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading your budget...</p>
        </div>
      </div>
    );
  }

  if (!state.userId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Budget Planner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income">Monthly Income</Label>
            <Input
              id="income"
              type="number"
              value={state.totalIncome || ''}
              onChange={handleIncomeChange}
              placeholder="Enter your monthly income"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="savings">Target Savings</Label>
            <Input
              id="savings"
              type="number"
              value={state.targetSavings || ''}
              onChange={handleSavingsChange}
              placeholder="Enter your target savings"
            />
          </div>

          <div className="space-y-2">
            <Label>Add Allocation</Label>
            <div className="flex gap-2">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={allocationAmount}
                onChange={(e) => setAllocationAmount(e.target.value)}
                placeholder="Amount"
                disabled={isLoading}
              />
              <Button onClick={handleAllocationSubmit} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add'
                )}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Budget Progress</Label>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Allocated: ${state.totalIncome - state.unallocated} / ${state.totalIncome}
            </p>
          </div>

          {state.allocations.length > 0 && (
            <div key="allocations" className="space-y-2">
              <Label>Current Allocations</Label>
              <div className="space-y-2">
                {state.allocations.map((allocation) => (
                  <div
                    key={`allocation-${allocation.id}`}
                    className="flex justify-between items-center p-2 bg-muted rounded"
                  >
                    <span>{allocation.category}</span>
                    <span>${allocation.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div key="suggestions" className="space-y-2">
              <Label>Suggestions</Label>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <p key={`suggestion-${index}`} className="text-sm text-muted-foreground">
                    {suggestion}
                  </p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
