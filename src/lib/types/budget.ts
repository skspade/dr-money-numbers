export interface BudgetAllocation {
  id: string;
  userId: string;
  category: string;
  amount: number;
  frequency: 'WEEKLY' | 'MONTHLY' | 'ANNUAL';
  allocated: number;
  target?: {
    type: 'weekly' | 'monthly';
    amount: number;
  };
  spent: number;
  available: number;
}

export interface BudgetState {
  userId: string;
  totalIncome: number;
  targetSavings: number;
  allocations: BudgetAllocation[];
  unallocated: number;
}

export class BudgetGuard {
  private readonly _availableFunds: number;
  private readonly _isInitialSetup: boolean;

  constructor(
    private readonly income: number,
    private readonly savings: number,
    private readonly allocations: BudgetAllocation[],
    isInitialSetup: boolean = false
  ) {
    this._isInitialSetup = isInitialSetup;
    this._availableFunds = income - savings - 
      allocations.reduce((sum, a) => sum + a.allocated, 0);
  }

  get availableFunds(): number {
    return this._availableFunds;
  }

  static getTotalAllocated(allocations: BudgetAllocation[]): number {
    return allocations.reduce((sum, a) => sum + a.allocated, 0);
  }

  private validateBasicRules(allocation: BudgetAllocation): { valid: boolean; message?: string } {
    if (allocation.allocated < 0) {
      return { 
        valid: false, 
        message: 'Allocation amount cannot be negative' 
      };
    }

    if (this.income <= 0) {
      return {
        valid: false,
        message: 'Income must be set before making allocations'
      };
    }

    return { valid: true };
  }

  canAllocate(amount: number): boolean {
    // Even during initial setup, we need some basic validation
    if (this.income <= 0) return false;
    
    // During initial setup, we only check against total income
    if (this._isInitialSetup) {
      return amount <= this.income;
    }
    
    // Normal operation checks against available funds
    return amount <= this._availableFunds;
  }

  validateAllocation(allocation: BudgetAllocation, isInitialAllocation: boolean = false): { 
    valid: boolean; 
    message?: string; 
  } {
    // Always check basic rules first
    const basicValidation = this.validateBasicRules(allocation);
    if (!basicValidation.valid) {
      return basicValidation;
    }

    // During initial setup, ensure total allocations don't exceed income
    if (this._isInitialSetup || isInitialAllocation) {
      const currentTotal = BudgetGuard.getTotalAllocated(this.allocations);
      const newTotal = currentTotal + allocation.allocated;
      
      if (newTotal > this.income) {
        return {
          valid: false,
          message: `Total allocations (${newTotal}) cannot exceed income (${this.income})`
        };
      }
      return { valid: true };
    }

    // Normal operation validation
    if (!this.canAllocate(allocation.allocated)) {
      return { 
        valid: false, 
        message: `Insufficient funds. Available: $${this._availableFunds.toFixed(2)}` 
      };
    }

    return { valid: true };
  }
}
