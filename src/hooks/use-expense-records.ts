import { useState, useEffect, useCallback } from 'react';
import type { IExpenseRecord } from '@/data/input-number';
import { MOCK_EXPENSE_RECORDS } from '@/data/input-number';

const STORAGE_KEY = '__app_decoration_expense_records';

function getStorage() {
  try {
    return localStorage;
  } catch {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    } as unknown as Storage;
  }
}

export function useExpenseRecords() {
  const [records, setRecords] = useState<IExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = getStorage().getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as IExpenseRecord[];
        setRecords(parsed);
      } else {
        setRecords(MOCK_EXPENSE_RECORDS);
        getStorage().setItem(STORAGE_KEY, JSON.stringify(MOCK_EXPENSE_RECORDS));
      }
    } catch {
      setRecords(MOCK_EXPENSE_RECORDS);
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = useCallback((data: IExpenseRecord[]) => {
    getStorage().setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const addRecord = useCallback(
    (record: Omit<IExpenseRecord, 'id' | 'createdAt' | 'source'>) => {
      const newRecord: IExpenseRecord = {
        ...record,
        id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        source: 'user',
      };
      setRecords((prev) => {
        const next = [newRecord, ...prev];
        persist(next);
        return next;
      });
      return newRecord;
    },
    [persist],
  );

  const updateRecord = useCallback(
    (id: string, patch: Partial<IExpenseRecord>) => {
      setRecords((prev) => {
        const next = prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const deleteRecord = useCallback(
    (id: string) => {
      setRecords((prev) => {
        const next = prev.filter((r) => r.id !== id);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const clearAll = useCallback(() => {
    setRecords([]);
    persist([]);
  }, [persist]);

  return { records, loading, addRecord, updateRecord, deleteRecord, clearAll, setRecords };
}
