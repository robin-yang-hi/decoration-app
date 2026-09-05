import { useState, useEffect, useCallback, useMemo } from 'react';
import { TODO_CATEGORIES, type TodoStatus, type ITodoCategory } from '@/data/todo-config';

const STORAGE_KEY = '__app_decoration_todo_items';

function getStorage() {
  try { return localStorage; } catch {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage;
  }
}

function buildInitialCategories(): ITodoCategory[] {
  return TODO_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.map((item) => ({ ...item })),
  }));
}

export function useTodoItems() {
  const [categories, setCategories] = useState<ITodoCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = getStorage().getItem(STORAGE_KEY);
      if (raw) {
        const savedStatusMap = JSON.parse(raw) as Record<string, TodoStatus>;
        const initial = buildInitialCategories();
        initial.forEach((cat) => {
          cat.items.forEach((item) => {
            if (savedStatusMap[item.id] !== undefined) {
              item.status = savedStatusMap[item.id];
            }
          });
        });
        setCategories(initial);
      } else {
        setCategories(buildInitialCategories());
      }
    } catch {
      setCategories(buildInitialCategories());
    } finally {
      setLoading(false);
    }
  }, []);

  const persistStatusMap = useCallback((cats: ITodoCategory[]) => {
    const map: Record<string, TodoStatus> = {};
    cats.forEach((cat) => {
      cat.items.forEach((item) => {
        map[item.id] = item.status;
      });
    });
    getStorage().setItem(STORAGE_KEY, JSON.stringify(map));
  }, []);

  const updateItemStatus = useCallback(
    (itemId: string, status: TodoStatus) => {
      setCategories((prev) => {
        const next = prev.map((cat) => ({
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId ? { ...item, status } : item,
          ),
        }));
        persistStatusMap(next);
        return next;
      });
    },
    [persistStatusMap],
  );

  const resetAll = useCallback(() => {
    const initial = buildInitialCategories();
    setCategories(initial);
    persistStatusMap(initial);
  }, [persistStatusMap]);

  const overallProgress = useMemo(() => {
    let total = 0;
    let done = 0;
    categories.forEach((cat) => {
      cat.items.forEach((item) => {
        if (item.status !== 'not_applicable') {
          total += 1;
          if (item.status === 'done') done += 1;
        }
      });
    });
    return total > 0 ? (done / total) * 100 : 0;
  }, [categories]);

  const categoryProgress = useMemo(() => {
    const map: Record<string, number> = {};
    categories.forEach((cat) => {
      let total = 0;
      let done = 0;
      cat.items.forEach((item) => {
        if (item.status !== 'not_applicable') {
          total += 1;
          if (item.status === 'done') done += 1;
        }
      });
      map[cat.id] = total > 0 ? (done / total) * 100 : 0;
    });
    return map;
  }, [categories]);

  const counts = useMemo(() => {
    let total = 0, done = 0, inProgress = 0, pending = 0, notApplicable = 0;
    categories.forEach((cat) => {
      cat.items.forEach((item) => {
        if (item.status === 'not_applicable') notApplicable += 1;
        else {
          total += 1;
          if (item.status === 'done') done += 1;
          else if (item.status === 'in_progress') inProgress += 1;
          else if (item.status === 'pending') pending += 1;
        }
      });
    });
    return { total, done, inProgress, pending, notApplicable };
  }, [categories]);

  return {
    categories,
    loading,
    updateItemStatus,
    resetAll,
    overallProgress,
    categoryProgress,
    counts,
  };
}
