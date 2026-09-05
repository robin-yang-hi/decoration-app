import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = '__app_decoration_ai_config';

export interface IAiConfig {
  apiKey: string;
  model: string;
  apiBase: string;
}

const DEFAULT_CONFIG: IAiConfig = {
  apiKey: '',
  model: 'doubao-pro-32k',
  apiBase: 'https://ark.cn-beijing.volces.com/api/v3',
};

function getStorage() {
  try { return localStorage; } catch {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage;
  }
}

export function useAiConfig() {
  const [config, setConfig] = useState<IAiConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = getStorage().getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<IAiConfig>;
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAiConfig = useCallback((next: IAiConfig) => {
    setConfig(next);
    getStorage().setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const clearAiConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    getStorage().removeItem(STORAGE_KEY);
  }, []);

  return { config, loading, saveAiConfig, clearAiConfig };
}
