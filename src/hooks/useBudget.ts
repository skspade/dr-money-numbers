import { useState, useCallback, useMemo } from 'react';
import { BudgetAllocation, BudgetState, BudgetGuard } from '../lib/types/budget';

type BudgetAction = 
  | { type: 'SET_INCOME'; amount: number }
  | { type: 'SET_SAVINGS'; amount: number }
  | { type: 'ADD_ALLOCATION'; allocation: BudgetAllocation }
  | { type: 'UPDATE_ALLOCATION'; allocation: BudgetAllocation }
  | { type: 'UPDATE_SPENDING'; categoryId: string; amount: number };

export const useBudget = (initialState?: Partial<BudgetState>) => {
  const [state, setState] = useState<BudgetState>(() => ({
    totalIncome: initialState?.totalIncome ?? 0,
    targetSavings: initialState?.targetSavings ?? 0,
    allocations: initialState?.allocations ?? [],
    unallocated: initialState?.totalIncome ?? 0,
  }));

  const budgetGuard = useMemo(() => {
    return new BudgetGuard(
      state.totalIncome,
      state.targetSavings,
      state.allocations
    );
  }, [state.totalIncome, state.targetSavings, state.allocations]);

  const dispatch = useCallback((action: BudgetAction) => {
    setState((currentState) => {
      switch (action.type) {
        case 'SET_INCOME': {
          const newIncome = Math.max(0, action.amount);
          return {
            ...currentState,
            totalIncome: newIncome,
            unallocated: newIncome - BudgetGuard.getTotalAllocated(currentState.allocations),
          };
        }

        case 'SET_SAVINGS': {
          const newSavings = Math.max(0, action.amount);
          if (newSavings > currentState.totalIncome) {
            return currentState;
          }
          return {
            ...currentState,
            targetSavings: newSavings,
            unallocated: currentState.totalIncome - newSavings - 
              BudgetGuard.getTotalAllocated(currentState.allocations),
          };
        }

        case 'ADD_ALLOCATION': {
          const validation = budgetGuard.validateAllocation(action.allocation);
          if (!validation.valid) {
            console.error(validation.message);
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
            console.error(validation.message);
            return currentState;
          }

          const newAllocations = currentState.allocations.map((a) =>
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
          const newAllocations = currentState.allocations.map((allocation) => {
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
  }, [budgetGuard]);

  return {
    state,
    dispatch,
    availableFunds: budgetGuard.availableFunds,
    isAllocationValid: (allocation: BudgetAllocation) => 
      budgetGuard.validateAllocation(allocation).valid,
  };
};
