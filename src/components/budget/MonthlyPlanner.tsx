"use client";

import { useEffect, useState, useMemo, ChangeEvent } from "react";
import { useBudget } from "@/hooks/useBudget";
import { FinancialAdvisor, FinancialContext } from "@/lib/ai-agents/financialAdvisor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { saveBudgetAllocation } from "@/app/actions/budget";
import { Loader2 } from "lucide-react";

const DEFAULT_CATEGORIES = [
  "Housing",
  "Transportation",
  "Food",
  "Utilities",
  "Healthcare",
  "Entertainment",
  "Savings",
];

export function MonthlyPlanner() {
  const { state, dispatch } = useBudget();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [allocationAmount, setAllocationAmount] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const advisor = useMemo(() => new FinancialAdvisor(), []);

  const handleIncomeChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: "SET_INCOME", amount: parseFloat(e.target.value) || 0 });
  };

  const handleSavingsChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: "SET_SAVINGS", amount: parseFloat(e.target.value) || 0 });
  };

  const handleAllocationSubmit = async () => {
    const amount = parseFloat(allocationAmount);
    if (!selectedCategory || isNaN(amount) || !state.userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const allocationId = await saveBudgetAllocation({
        category: selectedCategory,
        amount,
        frequency: "MONTHLY",
        allocated: amount,
        spent: 0,
        available: amount,
      });

      dispatch({
        type: "ADD_ALLOCATION",
        allocation: {
          id: allocationId,
          userId: state.userId,
          category: selectedCategory,
          amount,
          frequency: "MONTHLY",
          allocated: amount,
          spent: 0,
          available: amount,
        },
      });

      setSelectedCategory("");
      setAllocationAmount("");
    } catch (error) {
      console.error("Failed to save allocation:", error);
      setError("Failed to save allocation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateSuggestions = async () => {
    if (!state.userId) return; // Don't update suggestions if user is not authenticated

    setIsLoading(true);
    setError(null);

    try {
      const context: FinancialContext = {
        budget: {
          ...state,
          allocations: state.allocations.map(a => ({
            ...a,
            userId: state.userId,
          })),
        },
        monthlyIncome: state.totalIncome,
        monthlySavings: state.targetSavings,
        expenses: state.allocations.map(a => ({
          category: a.category,
          amount: a.amount,
          isRecurring: true
        })),
        goals: []
      };

      const advice = await advisor.generateAdvice(context);
      setSuggestions(advice.map(a => `${a.title}: ${a.description}`));
    } catch (error) {
      console.error("Failed to get suggestions:", error);
      setError("Failed to get AI suggestions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (state.totalIncome > 0 && state.userId) {
      updateSuggestions();
    }
  }, [state.totalIncome, state.targetSavings, state.allocations, state.userId]);

  const progress = state.totalIncome > 0 ? ((state.totalIncome - state.unallocated) / state.totalIncome * 100) : 0;

  // Show loading state while waiting for auth
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
              value={state.totalIncome || ""}
              onChange={handleIncomeChange}
              placeholder="Enter your monthly income"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="savings">Target Savings</Label>
            <Input
              id="savings"
              type="number"
              value={state.targetSavings || ""}
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
                  "Add"
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
            <div className="space-y-2">
              <Label>Current Allocations</Label>
              <div className="space-y-2">
                {state.allocations.map((allocation) => (
                  <div
                    key={allocation.id}
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
            <div className="space-y-2">
              <Label>AI Suggestions</Label>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
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
