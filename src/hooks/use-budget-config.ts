import { useState, useEffect, useCallback } from 'react';
import type { IBudgetConfig } from '@/data/budget';
import { DEFAULT_BUDGET_CONFIG } from '@/data/budget';

const STORAGE_KEY = '__app_decoration_budget_config';

function getStorage() {
  try { return localStorage; } catch {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage;
  }
}

export function useBudgetConfig() {
  const [budget, setBudget] = useState<IBudgetConfig>(DEFAULT_BUDGET_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = getStorage().getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as IBudgetConfig;
        setBudget({ ...DEFAULT_BUDGET_CONFIG, ...parsed });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const saveBudget = useCallback((config: IBudgetConfig) => {
    setBudget(config);
    getStorage().setItem(STORAGE_KEY, JSON.stringify(config));
  }, []);

  const setBudgetValue = useCallback((config: IBudgetConfig) => {
    setBudget(config);
    getStorage().setItem(STORAGE_KEY, JSON.stringify(config));
  }, []);

  return { budget, loading, saveBudget, setBudget: setBudgetValue };
}
