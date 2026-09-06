// Cloudflare Pages Function: /api/analyze
// 后端调用 DeepSeek API，API Key 存在环境变量 DEEPSEEK_API_KEY，前端不可见

const DEEPSEEK_API_BASE = "https://api.deepseek.com/v1";
const DEEPSEEK_MODEL = "deepseek-chat";

// 简单频率限制：每个 IP 每分钟最多 10 次
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

export const onRequestOptions = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};

export const onRequestPost = async (context: any) => {
  try {
    const apiKey = context.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI 服务未配置，请管理员在 Cloudflare 设置 DEEPSEEK_API_KEY" }),
        { status: 503, headers: corsHeaders }
      );
    }

    // 频率限制（基于 IP，用 KV 存计数）
    const ip = context.request.headers.get("CF-Connecting-IP") || "unknown";
    const rateKey = `rate_limit_${ip}`;
    try {
      const kv = context.env.DECO_DATA;
      if (kv) {
        const raw = await kv.get(rateKey);
        const now = Date.now();
        let count = 0;
        let windowStart = now;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (now - parsed.windowStart < RATE_WINDOW_MS) {
            count = parsed.count;
            windowStart = parsed.windowStart;
          }
        }
        if (count >= RATE_LIMIT) {
          return new Response(
            JSON.stringify({ error: "调用过于频繁，请稍后再试（每分钟最多 10 次）" }),
            { status: 429, headers: corsHeaders }
          );
        }
        await kv.put(rateKey, JSON.stringify({ count: count + 1, windowStart }));
      }
    } catch {
      // 频率限制失败不阻断请求
    }

    // 解析请求体
    const body = await context.request.json();
    const records = body.records || [];
    const budget = body.budget || { totalBudget: 0, categoryBudgets: {} };

    if (records.length === 0) {
      return new Response(
        JSON.stringify({ error: "暂无费用记录可分析" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 组装分析数据
    const totalSpent = records.reduce((s: number, r: any) => s + r.amount, 0);
    const categoryTotals: Record<string, number> = {};
    const categoryLabels: Record<string, string> = {
      design: "设计费", hardware: "硬装", main_material: "主材",
      soft_furnishing: "软装", appliance: "家电", labor: "人工费用", other: "其他杂费",
    };
    records.forEach((r: any) => {
      categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.amount;
    });
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const budgetPercent = budget.totalBudget > 0 ? ((totalSpent / budget.totalBudget) * 100).toFixed(1) : "未设置";

    // 组装 prompt
    const prompt = `你是一位专业的装修预算分析顾问。请根据以下用户的装修费用数据，给出一份清晰、实用的分析报告。

【数据概览】
- 累计总支出：¥${totalSpent.toLocaleString('zh-CN')}
- 记录笔数：${records.length} 笔
- 总预算：¥${(budget.totalBudget || 0).toLocaleString('zh-CN')}
- 预算使用率：${budgetPercent}%

【各分类花费】
${sortedCategories.map(([cat, amt]) => {
  const label = categoryLabels[cat] || cat;
  const pct = totalSpent > 0 ? ((amt / totalSpent) * 100).toFixed(1) : '0';
  const catBudget = budget.categoryBudgets?.[cat] || 0;
  return `- ${label}：¥${amt.toLocaleString('zh-CN')}（占比 ${pct}%${catBudget > 0 ? `，预算 ¥${catBudget.toLocaleString('zh-CN')}` : ''}）`;
}).join('\n')}

【最近 5 笔记录】
${records.slice(0, 5).map((r: any) => `- ${r.date} ${categoryLabels[r.category] || r.category}/${r.subCategory || ''} ¥${r.amount.toLocaleString('zh-CN')}${r.merchant ? '（' + r.merchant + '）' : ''}`).join('\n')}

请用中文输出，包含以下部分（用 markdown 格式）：
1. **总览判断**：一句话总结当前花费状况
2. **分类分析**：对花费最多的 2-3 个分类给出具体点评
3. **预算建议**：结合预算使用率给出建议
4. **风险提示**：指出可能超支或需要注意的地方
5. **行动建议**：给出 2-3 条可操作的具体建议

语气专业但易懂，不要太啰嗦，重点突出。`;

    // 调用 DeepSeek API
    const deepseekRes = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: "system",
            content: "你是一位专业的装修预算分析顾问，擅长根据用户的花费数据给出实用、具体的建议。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!deepseekRes.ok) {
      const errText = await deepseekRes.text();
      return new Response(
        JSON.stringify({ error: `AI 服务返回错误：${deepseekRes.status} ${errText.slice(0, 200)}` }),
        { status: 502, headers: corsHeaders }
      );
    }

    const data = await deepseekRes.json();
    const content = data.choices?.[0]?.message?.content || "分析结果为空，请重试。";

    return new Response(
      JSON.stringify({ content }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `分析失败：${String(err?.message || err)}` }),
      { status: 500, headers: corsHeaders }
    );
  }
};
