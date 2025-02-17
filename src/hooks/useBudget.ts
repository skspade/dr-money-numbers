import { useState, useCallback, useMemo, useEffect } from 'react';
import { BudgetAllocation, BudgetState, BudgetGuard } from '../lib/types/budget';
import { useSession } from 'next-auth/react';
import { useDebouncedCallback } from 'use-debounce';

type BudgetAction = 
  | { type: 'SET_INCOME'; amount: number }
  | { type: 'SET_SAVINGS'; amount: number }
  | { type: 'ADD_ALLOCATION'; allocation: BudgetAllocation }
  | { type: 'UPDATE_ALLOCATION'; allocation: BudgetAllocation }
  | { type: 'UPDATE_SPENDING'; categoryId: string; amount: number }
  | { type: 'RESET_ALLOCATIONS' }
  | { type: 'SET_INITIAL_STATE'; state: Partial<BudgetState> };

interface BudgetInitialState extends Partial<BudgetState> {
  userId?: string;
}

export const useBudget = (initialState?: BudgetInitialState) => {
  const { data: session, status } = useSession();
  const [state, setState] = useState<BudgetState>(() => ({
    userId: initialState?.userId ?? session?.user?.id ?? '',
    totalIncome: initialState?.totalIncome ?? 0,
    targetSavings: initialState?.targetSavings ?? 0,
    allocations: initialState?.allocations ?? [],
    unallocated: initialState?.totalIncome ?? 0,
  }));

  const [isInitialSetup, setIsInitialSetup] = useState(
    !initialState?.totalIncome || initialState.totalIncome === 0
  );

  const [error, setError] = useState<string | null>(null);

  const budgetGuard = useMemo(() => {
    return new BudgetGuard(
      state.totalIncome,
      state.targetSavings,
      state.allocations,
      isInitialSetup
    );
  }, [state.totalIncome, state.targetSavings, state.allocations, isInitialSetup]);

  // Update userId when session changes or when provided via props
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      setState(prev => ({ ...prev, userId: session.user.id }));
    }
  }, [session, status]);

  // Clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const debouncedSetState = useDebouncedCallback((updater: (currentState: BudgetState) => BudgetState) => {
    setState(updater);
  }, 100);

  const dispatch = useCallback((action: BudgetAction) => {
    try {
      debouncedSetState((currentState: BudgetState) => {
        switch (action.type) {
          case 'SET_INITIAL_STATE': {
            const newState = {
              ...currentState,
              ...action.state,
              unallocated: action.state.totalIncome ?? currentState.totalIncome,
            };
            if (newState.totalIncome > 0) {
              setIsInitialSetup(false);
            }
            return newState;
          }

          case 'RESET_ALLOCATIONS': {
            return {
              ...currentState,
              allocations: [],
              unallocated: currentState.totalIncome,
            };
          }

          case 'SET_INCOME': {
            const newIncome = Math.max(0, action.amount);
            // Only exit initial setup if we have a valid income
            if (newIncome > 0) {
              setIsInitialSetup(false);
            }

            const newState = {
              ...currentState,
              totalIncome: newIncome,
              unallocated: newIncome - BudgetGuard.getTotalAllocated(currentState.allocations),
            };

            // Validate the new state
            const guard = new BudgetGuard(
              newState.totalIncome,
              newState.targetSavings,
              newState.allocations,
              isInitialSetup
            );

            if (guard.availableFunds < 0) {
              setError('Warning: Current allocations exceed new income');
            }

            return newState;
          }

          case 'SET_SAVINGS': {
            const newSavings = Math.max(0, action.amount);
            if (newSavings > currentState.totalIncome) {
              setError('Savings cannot exceed income');
              return currentState;
            }

            const newState = {
              ...currentState,
              targetSavings: newSavings,
              unallocated: currentState.totalIncome - newSavings - 
                BudgetGuard.getTotalAllocated(currentState.allocations),
            };

            if (newState.unallocated < 0) {
              setError('Warning: Current allocations and savings exceed income');
            }

            return newState;
          }

          case 'ADD_ALLOCATION': {
            const validation = budgetGuard.validateAllocation(action.allocation, true);
            if (!validation.valid) {
              setError(validation.message ?? 'Invalid allocation');
              return currentState;
            }

            const newAllocations = [...currentState.allocations, action.allocation];
            return {
              ...currentState,
              allocations: newAllocations,
              unallocated: currentState.totalIncome - currentState.targetSavings - 
                BudgetGuard.getTotalAllocated(newAllocations),
            };
          }

          case 'UPDATE_ALLOCATION': {
            const validation = budgetGuard.validateAllocation(action.allocation);
            if (!validation.valid) {
              setError(validation.message ?? 'Invalid allocation update');
              return currentState;
            }

            const newAllocations = currentState.allocations.map((a: BudgetAllocation) =>
              a.id === action.allocation.id ? action.allocation : a
            );

            return {
              ...currentState,
              allocations: newAllocations,
              unallocated: currentState.totalIncome - currentState.targetSavings - 
                BudgetGuard.getTotalAllocated(newAllocations),
            };
          }

          case 'UPDATE_SPENDING': {
            const newAllocations = currentState.allocations.map((allocation: BudgetAllocation) => {
              if (allocation.id === action.categoryId) {
                const spent = Math.max(0, action.amount);
                return {
                  ...allocation,
                  spent,
                  available: allocation.allocated - spent,
                };
              }
              return allocation;
            });

            return {
              ...currentState,
              allocations: newAllocations,
            };
          }

          default:
            return currentState;
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }, [budgetGuard, debouncedSetState, isInitialSetup]);

  return {
    state,
    dispatch,
    availableFunds: budgetGuard.availableFunds,
    isInitialSetup,
    error,
    isAllocationValid: (allocation: BudgetAllocation) => 
      budgetGuard.validateAllocation(allocation).valid,
  };
};
