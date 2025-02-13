import React from 'react'

export interface MonthlyPlannerProps {
  month: string
  year: number
  categories: {
    name: string
    budget: number
    spent: number
  }[]
}

export function MonthlyPlanner({ month, year, categories }: MonthlyPlannerProps) {
  return (
    <div>
      {/* Add component implementation */}
    </div>
  )
}
