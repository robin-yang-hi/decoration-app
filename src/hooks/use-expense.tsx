import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useExpenseRecords } from '@/hooks/use-expense-records';
import { useBudgetConfig } from '@/hooks/use-budget-config';
import { useTodoItems } from '@/hooks/use-todo-items';
import { useAiConfig, type IAiConfig } from '@/hooks/use-ai-config';
import { fetchCloudData, saveCloudData, type CloudData } from '@/lib/api';
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
  // 云端同步状态
  cloudLoading: boolean;
  cloudSynced: boolean;
  cloudLastSaved: string | null;
  syncNow: () => void;
}

const ExpenseContext = createContext<ExpenseContextValue | null>(null);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const { records, loading, addRecord, updateRecord, deleteRecord, clearAll, setRecords } = useExpenseRecords();
  const { budget, loading: budgetLoading, saveBudget, setBudget } = useBudgetConfig();
  const {
    categories: todoCategories,
    loading: todoLoading,
    updateItemStatus: updateTodoStatus,
    resetAll: resetTodoAll,
    applyStatusMap,
    overallProgress: overallTodoProgress,
    categoryProgress: categoryTodoProgress,
    counts: todoCounts,
  } = useTodoItems();
  const { config: aiConfig, loading: aiConfigLoading, saveAiConfig, clearAiConfig, setConfig } = useAiConfig();

  const [cloudLoading, setCloudLoading] = useState(true);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [cloudLastSaved, setCloudLastSaved] = useState<string | null>(null);

  // 标记是否已完成首次云端拉取（拉取期间不触发保存，避免空数据覆盖云端）
  const hasSyncedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 从 status map 提取（用于导出/保存）
  const getTodoStatusMap = (cats: ITodoCategory[]): Record<string, TodoStatus> => {
    const map: Record<string, TodoStatus> = {};
    cats.forEach((cat) => {
      cat.items.forEach((item) => {
        map[item.id] = item.status;
      });
    });
    return map;
  };

  // 启动时从云端拉取数据，覆盖本地
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cloud = await fetchCloudData();
        if (cancelled) return;
        if (cloud && (cloud.records?.length || cloud.budget || cloud.todoStatus || cloud.aiConfig)) {
          // 云端有数据，覆盖本地
          if (Array.isArray(cloud.records)) setRecords(cloud.records);
          if (cloud.budget && typeof cloud.budget === 'object') setBudget(cloud.budget as IBudgetConfig);
          if (cloud.todoStatus && typeof cloud.todoStatus === 'object') applyStatusMap(cloud.todoStatus);
          if (cloud.aiConfig && typeof cloud.aiConfig === 'object') setConfig(cloud.aiConfig as IAiConfig);
          setCloudSynced(true);
          setCloudLastSaved(cloud.updatedAt || null);
        } else {
          // 云端为空，保留本地数据，并立即上传一次初始化
          setCloudSynced(true);
        }
      } catch {
        // 拉取失败，降级到本地
        setCloudSynced(false);
      } finally {
        if (!cancelled) {
          hasSyncedRef.current = true;
          setCloudLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 数据变更时防抖保存到云端（首次拉取完成后才开始）
  useEffect(() => {
    if (!hasSyncedRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const payload: CloudData = {
        version: 1,
        updatedAt: new Date().toISOString(),
        records,
        budget,
        todoStatus: getTodoStatusMap(todoCategories),
        aiConfig: { apiKey: aiConfig.apiKey, model: aiConfig.model, apiBase: aiConfig.apiBase },
      };
      const ok = await saveCloudData(payload);
      if (ok) {
        setCloudSynced(true);
        setCloudLastSaved(payload.updatedAt);
      } else {
        setCloudSynced(false);
      }
    }, 1500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [records, budget, todoCategories, aiConfig]);

  // 手动立即同步
  const syncNow = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const payload: CloudData = {
      version: 1,
      updatedAt: new Date().toISOString(),
      records,
      budget,
      todoStatus: getTodoStatusMap(todoCategories),
      aiConfig: { apiKey: aiConfig.apiKey, model: aiConfig.model, apiBase: aiConfig.apiBase },
    };
    saveCloudData(payload).then((ok) => {
      if (ok) {
        setCloudSynced(true);
        setCloudLastSaved(payload.updatedAt);
      }
    });
    // 同时从云端重新拉取一次，确保多端一致
    fetchCloudData().then((cloud) => {
      if (cloud && cloud.updatedAt && (!cloudLastSaved || cloud.updatedAt > cloudLastSaved)) {
        if (Array.isArray(cloud.records)) setRecords(cloud.records);
        if (cloud.budget) setBudget(cloud.budget as IBudgetConfig);
        if (cloud.todoStatus) applyStatusMap(cloud.todoStatus);
        if (cloud.aiConfig) setConfig(cloud.aiConfig as IAiConfig);
      }
    });
  };

  const exportAllData = (): string => {
    const payload = {
      version: 1,
      exportAt: new Date().toISOString(),
      records,
      budget,
      todoStatus: getTodoStatusMap(todoCategories),
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
        applyStatusMap(data.todoStatus);
      }
      if (data.aiConfig && typeof data.aiConfig === 'object') {
        saveAiConfig(data.aiConfig as IAiConfig);
      }
      return { success: true, message: '数据导入成功，正在同步到云端…' };
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
        cloudLoading,
        cloudSynced,
        cloudLastSaved,
        syncNow,
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
