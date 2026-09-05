// Cloudflare Pages Function: /api/data
// 统一读写装修费用管家的全部数据（KV 存储）
// 绑定的 KV 命名空间变量名：DECO_DATA

const KV_KEY = "decoration_data_v1";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

export const onRequestOptions = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};

// GET /api/data —— 读取全部数据
export const onRequestGet = async (context: any) => {
  try {
    const kv = context.env.DECO_DATA;
    if (!kv) {
      return new Response(
        JSON.stringify({ error: "KV namespace DECO_DATA not bound" }),
        { status: 500, headers: corsHeaders }
      );
    }
    const raw = await kv.get(KV_KEY);
    return new Response(raw || "{}", { status: 200, headers: corsHeaders });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: String(err?.message || err) }),
      { status: 500, headers: corsHeaders }
    );
  }
};

// POST /api/data —— 覆盖保存全部数据
export const onRequestPost = async (context: any) => {
  try {
    const kv = context.env.DECO_DATA;
    if (!kv) {
      return new Response(
        JSON.stringify({ error: "KV namespace DECO_DATA not bound" }),
        { status: 500, headers: corsHeaders }
      );
    }
    const body = await context.request.text();
    // 简单校验：必须是合法 JSON
    JSON.parse(body);
    await kv.put(KV_KEY, body);
    return new Response(
      JSON.stringify({ ok: true, savedAt: new Date().toISOString() }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: String(err?.message || err) }),
      { status: 400, headers: corsHeaders }
    );
  }
};
