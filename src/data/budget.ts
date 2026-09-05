import type { ExpenseCategory } from './input-number';

export interface IBudgetConfig {
  totalBudget: number;
  categoryBudgets: Record<ExpenseCategory, number>;
}

export const DEFAULT_BUDGET_CONFIG: IBudgetConfig = {
  totalBudget: 0,
  categoryBudgets: {
    design: 0,
    hardware: 0,
    main_material: 0,
    soft_furnishing: 0,
    appliance: 0,
    labor: 0,
    other: 0,
  },
};
