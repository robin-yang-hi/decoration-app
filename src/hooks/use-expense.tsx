import { createContext, useContext, type ReactNode } from 'react';
import { useExpenseRecords } from '@/hooks/use-expense-records';
import { useBudgetConfig } from '@/hooks/use-budget-config';
import { useTodoItems } from '@/hooks/use-todo-items';
import { useAiConfig, type IAiConfig } from '@/hooks/use-ai-config';
import type { IExpenseRecord } from '@/data/input-number';
import type { IBudgetConfig } from '@/data/budget';
import type { ITodoCategory, TodoStatus } from '@/data/todo-config';

interface ExpenseContextValue {
  records: IExpenseRecord[];
  loading: boolean;
  addRecord: (record: Omit<IExpenseRecord, 'id' | 'createdAt' | 'source'>) => IExpenseRecord;
  updateRecord: (id: string, patch: Partial<IExpenseRecord>) => void;
  deleteRecord: (id: string) => void;
  clearAll: () => void;
  budget: IBudgetConfig;
  budgetLoading: boolean;
  saveBudget: (config: IBudgetConfig) => void;
  todoCategories: ITodoCategory[];
  todoLoading: boolean;
  updateTodoStatus: (itemId: string, status: TodoStatus) => void;
  resetTodoAll: () => void;
  overallTodoProgress: number;
  categoryTodoProgress: Record<string, number>;
  todoCounts: { total: number; done: number; inProgress: number; pending: number; notApplicable: number };
  aiConfig: IAiConfig;
  aiConfigLoading: boolean;
  saveAiConfig: (config: IAiConfig) => void;
  clearAiConfig: () => void;
  exportAllData: () => string;
  importAllData: (jsonStr: string) => { success: boolean; message: string };
}

const ExpenseContext = createContext<ExpenseContextValue | null>(null);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const { records, loading, addRecord, updateRecord, deleteRecord, clearAll, setRecords } = useExpenseRecords();
  const { budget, loading: budgetLoading, saveBudget } = useBudgetConfig();
  const {
    categories: todoCategories,
    loading: todoLoading,
    updateItemStatus: updateTodoStatus,
    resetAll: resetTodoAll,
    overallProgress: overallTodoProgress,
    categoryProgress: categoryTodoProgress,
    counts: todoCounts,
  } = useTodoItems();
  const { config: aiConfig, loading: aiConfigLoading, saveAiConfig, clearAiConfig } = useAiConfig();

  const exportAllData = (): string => {
    const payload = {
      version: 1,
      exportAt: new Date().toISOString(),
      records,
      budget,
      todoStatus: (() => {
        const map: Record<string, TodoStatus> = {};
        todoCategories.forEach((cat) => {
          cat.items.forEach((item) => {
            map[item.id] = item.status;
          });
        });
        return map;
      })(),
      aiConfig: { apiKey: aiConfig.apiKey, model: aiConfig.model, apiBase: aiConfig.apiBase },
    };
    return JSON.stringify(payload, null, 2);
  };

  const importAllData = (jsonStr: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== 'object') {
        return { success: false, message: '数据格式不正确' };
      }
      if (Array.isArray(data.records)) {
        setRecords(data.records);
      }
      if (data.budget && typeof data.budget === 'object') {
        saveBudget(data.budget as IBudgetConfig);
      }
      if (data.todoStatus && typeof data.todoStatus === 'object') {
        localStorage.setItem('__app_decoration_todo_items', JSON.stringify(data.todoStatus));
      }
      if (data.aiConfig && typeof data.aiConfig === 'object') {
        saveAiConfig(data.aiConfig as IAiConfig);
      }
      return { success: true, message: '数据导入成功' };
    } catch (err) {
      return { success: false, message: `导入失败：${String(err)}` };
    }
  };

  return (
    <ExpenseContext.Provider
      value={{
        records,
        loading,
        addRecord,
        updateRecord,
        deleteRecord,
        clearAll,
        budget,
        budgetLoading,
        saveBudget,
        todoCategories,
        todoLoading,
        updateTodoStatus,
        resetTodoAll,
        overallTodoProgress,
        categoryTodoProgress,
        todoCounts,
        aiConfig,
        aiConfigLoading,
        saveAiConfig,
        clearAiConfig,
        exportAllData,
        importAllData,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpense() {
  const ctx = useContext(ExpenseContext);
  if (!ctx) {
    throw new Error('useExpense must be used within ExpenseProvider');
  }
  return ctx;
}
