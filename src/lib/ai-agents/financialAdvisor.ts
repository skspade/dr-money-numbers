import { BudgetState } from '../types/budget';

interface BudgetSuggestion {
  category: string;
  currentAllocation: number;
  suggestedAdjustment: number;
  rationale: string;
  confidenceScore: number;
  impactAnalysis: {
    shortTerm: string;
    longTerm: string;
  };
}

interface FinancialAdvice {
  category: string;
  title: string;
  description: string;
  steps: string[];
  priority: 'high' | 'medium' | 'low';
  potentialImpact: number;
}

export interface FinancialContext {
  budget: BudgetState;
  monthlyIncome: number;
  monthlySavings: number;
  expenses: {
    category: string;
    amount: number;
    isRecurring: boolean;
  }[];
  goals: {
    type: 'saving' | 'investment' | 'debt';
    target: number;
    deadline: string;
    priority: number;
  }[];
}

export class FinancialAdvisor {
  async generateAdvice(context: FinancialContext): Promise<FinancialAdvice[]> {
    const advice: FinancialAdvice[] = [];

    // Check for unallocated funds (YNAB principle: give every dollar a job)
    if (context.budget.unallocated > 0) {
      advice.push({
        category: 'budget',
        title: 'Allocate Remaining Funds',
        description: `You have $${context.budget.unallocated.toFixed(2)} unallocated. Following YNAB principles, every dollar should have a specific purpose.`,
        steps: [
          'Review your financial goals',
          'Consider increasing emergency fund',
          'Look for underfunded categories',
          'Consider debt paydown if applicable',
        ],
        priority: 'high',
        potentialImpact: context.budget.unallocated / context.monthlyIncome,
      });
    }

    // Check for high spending categories
    const highSpendingCategories = context.budget.allocations
      .filter((a) => a.spent / a.allocated > 0.9)
      .map((a) => ({
        category: a.category,
        overspend: a.spent - a.allocated,
      }));

    if (highSpendingCategories.length > 0) {
      advice.push({
        category: 'spending',
        title: 'High Spending Alert',
        description: `You're close to or exceeding your budget in ${highSpendingCategories.length} categories.`,
        steps: highSpendingCategories.map((c) =>
          `Review ${c.category} spending (${c.overspend > 0 ? 'overspent by' : 'remaining'} $${Math.abs(c.overspend).toFixed(2)})`,
        ),
        priority: 'high',
        potentialImpact: highSpendingCategories.reduce((sum, c) => sum + c.overspend, 0) / context.monthlyIncome,
      });
    }

    // Check savings rate
    const savingsRate = context.monthlySavings / context.monthlyIncome;
    if (savingsRate < 0.2) {
      advice.push({
        category: 'savings',
        title: 'Increase Savings',
        description: `Your current savings rate is ${(savingsRate * 100).toFixed(1)}%. Consider aiming for at least 20%.`,
        steps: [
          'Review discretionary spending categories',
          'Look for opportunities to increase income',
          'Consider automating savings transfers',
          'Review and optimize fixed expenses',
        ],
        priority: 'medium',
        potentialImpact: (0.2 - savingsRate) * context.monthlyIncome,
      });
    }

    return advice;
  }

  async analyzeSpendingPatterns(context: FinancialContext): Promise<{
    category: string;
    status: 'over' | 'under' | 'on-track';
    recommendation: string;
  }[]> {
    const analysis = context.budget.allocations.map((allocation) => {
      const spendingRatio = allocation.spent / allocation.allocated;
      let status: 'over' | 'under' | 'on-track' = 'on-track';
      let recommendation = '';

      if (spendingRatio > 0.9) {
        status = 'over';
        recommendation = `Consider increasing ${allocation.category} budget or finding areas to reduce spending`;
      } else if (spendingRatio < 0.5) {
        status = 'under';
        recommendation = `You might be able to reallocate some funds from ${allocation.category} to other priorities`;
      }

      return {
        category: allocation.category,
        status,
        recommendation,
      };
    });

    return analysis;
  }

  async suggestBudgetAdjustments(context: FinancialContext): Promise<BudgetSuggestion[]> {
    const suggestions: BudgetSuggestion[] = [];

    // Analyze each category for potential adjustments
    context.budget.allocations.forEach((allocation) => {
      const spendingRatio = allocation.spent / allocation.allocated;
      const averageMonthlySpend = allocation.spent; // In a real implementation, this would use historical data

      if (spendingRatio > 0.9) {
        suggestions.push({
          category: allocation.category,
          currentAllocation: allocation.allocated,
          suggestedAdjustment: Math.ceil(averageMonthlySpend * 1.1) - allocation.allocated,
          rationale: 'Current allocation might be insufficient based on spending patterns',
          confidenceScore: 0.8,
          impactAnalysis: {
            shortTerm: 'Reduce stress about overspending',
            longTerm: 'More accurate budgeting and better financial planning',
          },
        });
      } else if (spendingRatio < 0.5) {
        suggestions.push({
          category: allocation.category,
          currentAllocation: allocation.allocated,
          suggestedAdjustment: Math.floor(averageMonthlySpend * 1.2) - allocation.allocated,
          rationale: 'Category might be over-budgeted',
          confidenceScore: 0.7,
          impactAnalysis: {
            shortTerm: 'Free up money for other categories',
            longTerm: 'More efficient use of available funds',
          },
        });
      }
    });

    return suggestions;
  }

  async handleUserQuery(userQuery: string): Promise<string> {
    // In a real implementation, this would use NLP to understand and respond to user questions
    return `I'm analyzing your query about "${userQuery}". Please be more specific about what you'd like to know.`;
  }
}
