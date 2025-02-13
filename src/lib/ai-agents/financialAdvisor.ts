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

interface FinancialAdvice {
  category: 'budget' | 'saving' | 'investment' | 'debt';
  title: string;
  description: string;
  steps: string[];
  priority: 'high' | 'medium' | 'low';
  potentialImpact: number;
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
          'Consider debt paydown if applicable'
        ],
        priority: 'high',
        potentialImpact: context.budget.unallocated / context.monthlyIncome
      });
    }

    // Additional advice based on spending patterns and goals
    return advice;
  }

  async analyzeSpendingPatterns(context: FinancialContext): Promise<{
    category: string;
    status: 'over' | 'under' | 'on-track';
    recommendation: string;
  }[]> {
    const analysis = context.budget.allocations.map(allocation => {
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
        recommendation
      };
    });

    return analysis;
  }

  async suggestBudgetAdjustments(context: FinancialContext): Promise<BudgetSuggestion[]> {
    const suggestions: BudgetSuggestion[] = [];
    
    // Analyze each category for potential adjustments
    context.budget.allocations.forEach(allocation => {
      const spendingRatio = allocation.spent / allocation.allocated;
      const averageMonthlySpend = allocation.spent; // In a real implementation, this would use historical data
      
      if (spendingRatio > 0.9) {
        suggestions.push({
          category: allocation.category,
          currentAllocation: allocation.allocated,
          suggestedAdjustment: Math.ceil(averageMonthlySpend * 1.1) - allocation.allocated,
          rationale: "Current allocation might be insufficient based on spending patterns",
          confidenceScore: 0.8,
          impactAnalysis: {
            shortTerm: "Reduce stress about overspending",
            longTerm: "More accurate budgeting and better financial planning"
          }
        });
      } else if (spendingRatio < 0.5 && allocation.target?.type !== 'monthly') {
        suggestions.push({
          category: allocation.category,
          currentAllocation: allocation.allocated,
          suggestedAdjustment: Math.floor(averageMonthlySpend * 1.2) - allocation.allocated,
          rationale: "Category might be over-budgeted",
          confidenceScore: 0.7,
          impactAnalysis: {
            shortTerm: "Free up money for other categories",
            longTerm: "More efficient use of available funds"
          }
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
