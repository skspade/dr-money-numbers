"use client";

import { useEffect, useState } from "react";
import { useBudget } from "@/hooks/useBudget";
import { BudgetAllocation } from "@/lib/types/budget";
import { FinancialAdvisor, FinancialContext } from "@/lib/ai-agents/financialAdvisor";
import { v4 as uuidv4 } from "uuid";

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
  const advisor = new FinancialAdvisor();

  useEffect(() => {
    // Get AI suggestions whenever the budget state changes
    const updateSuggestions = async () => {
      const context: FinancialContext = {
        budget: state,
        monthlyIncome: state.totalIncome,
        monthlySavings: state.targetSavings,
        expenses: state.allocations.map(a => ({
          category: a.category,
          amount: a.spent,
          isRecurring: true
        })),
        goals: [] // This would be populated from user preferences
      };

      const advice = await advisor.generateAdvice(context);
      const suggestions = advice.map(a => `${a.title}: ${a.description}`);
      setAiSuggestions(suggestions);
    };

    updateSuggestions();
  }, [state, advisor]);

  const handleIncomeChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    dispatch({ type: "SET_INCOME", amount });
  };

  const handleSavingsChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    dispatch({ type: "SET_SAVINGS", amount });
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
            <label className="block text-sm font-medium">Monthly Income</label>
            <input
              type="number"
              value={state.totalIncome || ""}
              onChange={(e) => handleIncomeChange(e.target.value)}
              className="block w-full rounded-md border px-3 py-2"
              placeholder="Enter monthly income"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Target Savings</label>
            <input
              type="number"
              value={state.targetSavings || ""}
              onChange={(e) => handleSavingsChange(e.target.value)}
              className="block w-full rounded-md border px-3 py-2"
              placeholder="Enter target savings"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full rounded-md border px-3 py-2"
            >
              <option value="">Select category</option>
              {DEFAULT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Amount</label>
            <input
              type="number"
              value={allocationAmount}
              onChange={(e) => setAllocationAmount(e.target.value)}
              className="block w-full rounded-md border px-3 py-2"
              placeholder="Enter amount"
            />
          </div>

          <button
            onClick={handleAllocation}
            disabled={!selectedCategory || !allocationAmount}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            Allocate Funds
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Current Allocations</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Available to allocate: ${availableFunds.toFixed(2)}
            </p>
            {state.allocations.map((allocation) => (
              <div
                key={allocation.id}
                className="rounded-lg border p-4 shadow-sm"
              >
                <div className="flex justify-between">
                  <span className="font-medium">{allocation.category}</span>
                  <span>${allocation.allocated.toFixed(2)}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded bg-gray-200">
                  <div
                    className="h-full bg-blue-600"
                    style={{
                      width: `${Math.min(
                        (allocation.spent / allocation.allocated) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-sm text-gray-600">
                  <span>Spent: ${allocation.spent.toFixed(2)}</span>
                  <span>
                    Available: ${allocation.available.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {aiSuggestions.length > 0 && (
        <div className="mt-6 rounded-lg border p-4">
          <h3 className="text-lg font-semibold">AI Suggestions</h3>
          <ul className="mt-2 space-y-2">
            {aiSuggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-gray-600">
                • {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
