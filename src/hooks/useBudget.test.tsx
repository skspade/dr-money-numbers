import { renderHook, act } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useBudget } from './useBudget';
import '@testing-library/jest-dom';
import { BudgetAllocation } from '../lib/types/budget';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock use-debounce with proper typing
jest.mock('use-debounce', () => ({
  useDebouncedCallback: <T extends (...args: unknown[]) => unknown>(callback: T) => callback,
}));

describe('useBudget', () => {
  const mockSession = {
    data: {
      user: {
        id: 'test-user-id',
      },
    },
    status: 'authenticated',
  };

  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue(mockSession);
  });

  it('should initialize with default values when no initial state is provided', () => {
    const { result } = renderHook(() => useBudget());

    expect(result.current.state).toEqual({
      userId: 'test-user-id',
      totalIncome: 0,
      targetSavings: 0,
      allocations: [],
      unallocated: 0,
    });
  });

  it('should initialize with provided initial state', () => {
    const initialState = {
      userId: 'test-user-id',
      totalIncome: 5000,
      targetSavings: 1000,
      allocations: [],
    };

    const { result } = renderHook(() => useBudget(initialState));

    expect(result.current.state).toEqual({
      ...initialState,
      unallocated: 5000,
    });
  });

  it('should update userId when session changes', () => {
    const { result, rerender } = renderHook(() => useBudget());

    // Change session
    const newSession = {
      data: {
        user: {
          id: 'new-user-id',
        },
      },
      status: 'authenticated',
    };
    (useSession as jest.Mock).mockReturnValue(newSession);

    rerender();

    expect(result.current.state.userId).toBe('new-user-id');
  });

  it('should handle SET_INITIAL_STATE action correctly', () => {
    const { result } = renderHook(() => useBudget());

    act(() => {
      result.current.dispatch({
        type: 'SET_INITIAL_STATE',
        state: {
          totalIncome: 5000,
          targetSavings: 1000,
          allocations: [],
        },
      });
    });

    expect(result.current.state).toEqual({
      userId: 'test-user-id',
      totalIncome: 5000,
      targetSavings: 1000,
      allocations: [],
      unallocated: 5000,
    });
  });

  it('should handle SET_INCOME action and recalculate unallocated amount', () => {
    const { result } = renderHook(() => useBudget({
      totalIncome: 5000,
      targetSavings: 1000,
      allocations: [
        {
          id: '1',
          userId: 'test-user-id',
          category: 'Housing',
          amount: 2000,
          frequency: 'MONTHLY',
          allocated: 2000,
          spent: 0,
          available: 2000,
        },
      ],
    }));

    act(() => {
      result.current.dispatch({
        type: 'SET_INCOME',
        amount: 6000,
      });
    });

    expect(result.current.state.totalIncome).toBe(6000);
    expect(result.current.state.unallocated).toBe(4000); // 6000 - 2000 (allocation)
  });

  it('should not allow negative income values', () => {
    const { result } = renderHook(() => useBudget());

    act(() => {
      result.current.dispatch({
        type: 'SET_INCOME',
        amount: -1000,
      });
    });

    expect(result.current.state.totalIncome).toBe(0);
  });

  it('should handle error states and clear them after timeout', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useBudget({
      totalIncome: 5000,
      targetSavings: 0,
      allocations: [],
    }));

    act(() => {
      result.current.dispatch({
        type: 'SET_SAVINGS',
        amount: 6000, // Exceeds income to trigger error
      });
    });

    expect(result.current.error).toBe('Savings cannot exceed income');

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.error).toBeNull();
    jest.useRealTimers();
  });

  it('should maintain state consistency during rapid updates', () => {
    const { result } = renderHook(() => useBudget({
      totalIncome: 5000,
      targetSavings: 1000,
      allocations: [],
    }));

    act(() => {
      // Simulate rapid sequential updates
      result.current.dispatch({ type: 'SET_INCOME', amount: 6000 });
      result.current.dispatch({ type: 'SET_SAVINGS', amount: 1500 });
      result.current.dispatch({
        type: 'ADD_ALLOCATION',
        allocation: {
          id: '1',
          userId: 'test-user-id',
          category: 'Housing',
          amount: 2000,
          frequency: 'MONTHLY' as const,
          allocated: 2000,
          spent: 0,
          available: 2000,
        },
      });
    });

    expect(result.current.state.totalIncome).toBe(6000);
    expect(result.current.state.targetSavings).toBe(1500);
    expect(result.current.state.allocations).toHaveLength(1);
    expect(result.current.state.unallocated).toBe(2500); // 6000 - 1500 - 2000
  });

  it('should handle session state transitions correctly', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    });

    const { result, rerender } = renderHook(() => useBudget());

    expect(result.current.state.userId).toBe('');

    // Simulate session loading completion
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: 'test-user-id' } },
      status: 'authenticated',
    });

    rerender();

    expect(result.current.state.userId).toBe('test-user-id');
  });

  it('should manage initial setup state correctly', () => {
    const { result } = renderHook(() => useBudget());

    expect(result.current.isInitialSetup).toBe(true);

    act(() => {
      result.current.dispatch({ type: 'SET_INCOME', amount: 5000 });
    });

    expect(result.current.isInitialSetup).toBe(false);

    act(() => {
      result.current.dispatch({ type: 'SET_INCOME', amount: 0 });
    });

    // Should still remain false once setup is complete
    expect(result.current.isInitialSetup).toBe(false);
  });

  it('should validate allocations against budget guard', () => {
    const { result } = renderHook(() => useBudget({
      totalIncome: 5000,
      targetSavings: 1000,
      allocations: [],
    }));

    const validAllocation: BudgetAllocation = {
      id: '1',
      userId: 'test-user-id',
      category: 'Housing',
      amount: 2000,
      frequency: 'MONTHLY',
      allocated: 2000,
      spent: 0,
      available: 2000,
    };

    const invalidAllocation: BudgetAllocation = {
      ...validAllocation,
      id: '2',
      allocated: 4500, // Would exceed available funds (5000 - 1000 = 4000 available)
    };

    expect(result.current.isAllocationValid(validAllocation)).toBe(true);
    expect(result.current.isAllocationValid(invalidAllocation)).toBe(false);

    // Add valid allocation first
    act(() => {
      result.current.dispatch({
        type: 'ADD_ALLOCATION',
        allocation: validAllocation,
      });
    });

    expect(result.current.state.allocations).toHaveLength(1);
    expect(result.current.state.unallocated).toBe(2000); // 5000 - 1000 - 2000

    // Try to add invalid allocation
    act(() => {
      result.current.dispatch({
        type: 'ADD_ALLOCATION',
        allocation: invalidAllocation,
      });
    });

    // The invalid allocation should be rejected
    expect(result.current.state.allocations).toHaveLength(1);
    expect(result.current.error).not.toBeNull();
  });
});
