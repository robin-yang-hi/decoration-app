// 云端数据 API 封装 —— 与 Cloudflare Pages Function (/api/data) 通信
import type { IExpenseRecord } from "@/data/input-number";
import type { IBudgetConfig } from "@/data/budget";
import type { TodoStatus } from "@/data/todo-config";
import type { IAiConfig } from "@/hooks/use-ai-config";

export interface CloudData {
  version: number;
  updatedAt: string;
  records: IExpenseRecord[];
  budget: IBudgetConfig;
  todoStatus: Record<string, TodoStatus>;
  aiConfig: IAiConfig;
}

const API_URL = "/api/data";

/** 从云端拉取全部数据；失败返回 null（降级到本地 localStorage） */
export async function fetchCloudData(): Promise<CloudData | null> {
  try {
    const res = await fetch(API_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || text === "{}") return null;
    const data = JSON.parse(text);
    if (!data || typeof data !== "object") return null;
    return data as CloudData;
  } catch {
    return null;
  }
}

/** 保存全部数据到云端；防抖由调用方控制 */
export async function saveCloudData(data: CloudData): Promise<boolean> {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, updatedAt: new Date().toISOString() }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
