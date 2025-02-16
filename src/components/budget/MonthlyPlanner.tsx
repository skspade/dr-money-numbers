"use client";

import { useEffect, useState, useMemo, ChangeEvent } from "react";
import { useBudget } from "@/hooks/useBudget";
import { BudgetAllocation } from "@/lib/types/budget";
import { FinancialAdvisor, FinancialContext } from "@/lib/ai-agents/financialAdvisor";
import { v4 as uuidv4 } from "uuid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
  const { state, dispatch, availableFunds, isAllocationValid } = useBudget();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [allocationAmount, setAllocationAmount] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  // Memoize the FinancialAdvisor instance
  const advisor = useMemo(() => new FinancialAdvisor(), []);

  useEffect(() => {
    const updateSuggestions = async () => {
      try {
        const context: FinancialContext = {
          budget: state,
          monthlyIncome: state.totalIncome,
          monthlySavings: state.targetSavings,
          expenses: state.allocations.map(a => ({
            category: a.category,
            amount: a.spent,
            isRecurring: true
          })),
          goals: []
        };

        const advice = await advisor.generateAdvice(context);
        const suggestions = advice.map(a => `${a.title}: ${a.description}`);
        setAiSuggestions(suggestions);
      } catch (error) {
        console.error("Failed to fetch AI suggestions:", error);
      }
    };

    updateSuggestions();
  }, [state, advisor]);

  const handleIncomeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(e.target.value) || 0;
    dispatch({ type: "SET_INCOME", amount });
  };

  const handleSavingsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(e.target.value) || 0;
    dispatch({ type: "SET_SAVINGS", amount });
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAllocationAmount(e.target.value);
  };

  const handleAllocation = () => {
    if (!selectedCategory || !allocationAmount) return;

    const amount = parseFloat(allocationAmount);
    if (isNaN(amount)) return;

    const newAllocation: BudgetAllocation = {
      id: uuidv4(),
      category: selectedCategory,
      allocated: amount,
      spent: 0,
      available: amount,
      target: {
        type: "monthly",
        amount: amount
      }
    };

    if (isAllocationValid(newAllocation)) {
      dispatch({ type: "ADD_ALLOCATION", allocation: newAllocation });
      setSelectedCategory("");
      setAllocationAmount("");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Monthly Budget Planner</h2>
          
          <div className="space-y-2">
            <Label htmlFor="monthly-income">Monthly Income</Label>
            <Input
              id="monthly-income"
              type="number"
              value={state.totalIncome || ""}
              onChange={handleIncomeChange}
              placeholder="Enter monthly income"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-savings">Target Savings</Label>
            <Input
              id="target-savings"
              type="number"
              value={state.targetSavings || ""}
              onChange={handleSavingsChange}
              placeholder="Enter target savings"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={allocationAmount}
              onChange={handleAmountChange}
              placeholder="Enter amount"
            />
          </div>

          <Button
            onClick={handleAllocation}
            disabled={!selectedCategory || !allocationAmount}
          >
            Allocate Funds
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Current Allocations</h3>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Available to allocate: ${availableFunds.toFixed(2)}
            </p>
            {state.allocations.map((allocation) => (
              <Card key={allocation.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{allocation.category}</span>
                    <span>${allocation.allocated.toFixed(2)}</span>
                  </div>
                  <Progress
                    value={(allocation.spent / allocation.allocated) * 100}
                    className="h-2"
                  />
                  <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                    <span>Spent: ${allocation.spent.toFixed(2)}</span>
                    <span>
                      Available: ${allocation.available.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {aiSuggestions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>AI Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {aiSuggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {suggestion}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
