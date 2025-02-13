export interface BudgetAllocation {
  id: string;
  category: string;
  allocated: number;
  target?: {
    type: 'weekly' | 'monthly';
    amount: number;
  };
  spent: number;
  available: number;
}

export interface BudgetState {
  totalIncome: number;
  targetSavings: number;
  allocations: BudgetAllocation[];
  unallocated: number;
}

export class BudgetGuard {
  private readonly _availableFunds: number;

  constructor(
    private readonly income: number,
    private readonly savings: number,
    private readonly allocations: BudgetAllocation[]
  ) {
    this._availableFunds = income - savings - 
      allocations.reduce((sum, a) => sum + a.allocated, 0);
  }

  get availableFunds(): number {
    return this._availableFunds;
  }

  canAllocate(amount: number): boolean {
    return amount <= this._availableFunds;
  }

  validateAllocation(allocation: BudgetAllocation): { 
    valid: boolean; 
    message?: string; 
  } {
    if (allocation.allocated < 0) {
      return { 
        valid: false, 
        message: 'Allocation amount cannot be negative' 
      };
    }

    if (!this.canAllocate(allocation.allocated)) {
      return { 
        valid: false, 
        message: `Insufficient funds. Available: $${this._availableFunds.toFixed(2)}` 
      };
    }

    return { valid: true };
  }

  static getTotalAllocated(allocations: BudgetAllocation[]): number {
    return allocations.reduce((sum, a) => sum + a.allocated, 0);
  }
}
