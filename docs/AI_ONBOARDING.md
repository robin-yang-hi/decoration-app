# AI 快速上手指南 — 装修费用管家

> 本文档专门写给 AI（包括豆包、Cursor、Copilot 等），用于快速理解本项目并高效完成修改任务。
> 读这篇比读完整源码快 10 倍。

---

## 0. 一句话定位

一个部署在 Cloudflare Pages 上的 React + TypeScript 装修费用管理 SPA，数据存在 Cloudflare KV，通过 Pages Function (`/api/data`) 读写，支持多端同步。

**线上地址**：https://decoration-app.pages.dev
**代码仓库**：https://github.com/robin-yang-hi/decoration-app（main 分支，push 自动部署）
**项目根目录**：`C:\Users\Administrator\Doubao\chats\2026-09-05\new-chat\decoration-app`

---

## 1. 项目结构速览

```
decoration-app/
├── functions/
│   └── api/
│       ├── data.ts          ← 【后端】Cloudflare Pages Function，/api/data 接口（KV 读写）
│       └── analyze.ts       ← 【后端】/api/analyze 接口（调用 DeepSeek AI，key 存环境变量）
├── src/
│   ├── index.tsx            ← 入口：HashRouter + ErrorBoundary
│   ├── app.tsx              ← 路由定义（4 个页面）
│   ├── index.css            ← Tailwind 入口 + 主题 CSS 变量
│   ├── components/
│   │   ├── Layout.tsx       ← 布局：ExpenseProvider + Header + 移动端底栏
│   │   ├── Header.tsx       ← 顶部导航 + PDF/CSV/备份/导入按钮
│   │   ├── AiAnalysisDialog.tsx  ← AI 分析弹窗（调用后端 /api/analyze）
│   │   └── ui/              ← Radix UI 基础组件（button/dialog/card...）
│   ├── hooks/
│   │   ├── use-expense.tsx  ← 【核心】ExpenseProvider，聚合 + 云端同步
│   │   ├── use-expense-records.ts  ← 费用记录 CRUD
│   │   ├── use-budget-config.ts    ← 预算配置
│   │   ├── use-todo-items.ts       ← 待办事项 + 完成度计算
│   │   ├── use-ai-config.ts        ← AI 配置（apiKey/model/apiBase）
│   │   └── use-mobile.ts           ← 移动端判断
│   ├── lib/
│   │   ├── api.ts           ← 云端 API 封装（fetchCloudData/saveCloudData）
│   │   ├── pdf-export.ts    ← PDF 导出（html2canvas + jspdf）
│   │   └── utils.ts         ← cn/formatCurrency/导出备份/读文件
│   ├── data/
│   │   ├── input-number.ts  ← IExpenseRecord 类型 + 7 分类 + 示例数据
│   │   ├── category-config.ts ← 分类中文标签/子分类建议/图表配色
│   │   ├── budget.ts        ← IBudgetConfig 类型 + 默认零预算
│   │   └── todo-config.ts   ← 10 大类 76 项待办 + 4 种状态
│   └── pages/
│       ├── OverviewPage/    ← 总览：统计卡片 + 饼图 + 柱状图 + 进度
│       ├── RecordsPage/     ← 费用记录：按月分组 + 增删改
│       ├── BudgetPage/      ← 预算设置
│       ├── ProgressPage/    ← 装修进度：10 类手风琴 + 状态切换
│       └── NotFoundPage/
├── vite.config.ts           ← base:'./' + @tailwindcss/vite + @ 别名
├── package.json
└── docs/                    ← 本文档所在目录
```

---

## 2. 关键约定（必须遵守）

### 2.1 数据层约定

- **所有数据操作必须通过 `useExpense()` hook**，不要直接操作 localStorage
- `ExpenseProvider` 在 `Layout.tsx` 中包裹整个应用，页面组件直接 `useExpense()` 取数据
- 新增数据字段时，必须同时修改：
  1. `src/data/` 下的类型定义
  2. 对应子 hook 的 localStorage 读写
  3. `use-expense.tsx` 的 `buildPayload()`（云端同步数据组装）
  4. `exportAllData()` / `importAllData()`
  5. `functions/api/data.ts` 无需改（它是透明的 JSON 存储）

### 2.2 云端同步约定

- KV 绑定变量名：`DECO_DATA`（在 Cloudflare Dashboard 配置，代码里通过 `context.env.DECO_DATA` 访问）
- KV key：`decoration_data_v1`
- 云端数据结构：`{ version, updatedAt, records, budget, todoStatus, aiConfig }`（aiConfig.apiKey 恒为空字符串，真实 key 存环境变量）
- **防抖 1.5 秒**：数据变化后 1.5 秒自动保存到云端，不要在每次操作里手动调用 saveCloudData
- **首次同步**：启动时拉取云端，有实际数据则覆盖本地；为空则主动上传本地
- **空对象不算有数据**：判断云端是否有数据时，`todoStatus` 必须 `Object.keys().length > 0`，`budget` 必须有非零字段，`records` 必须非空数组

### 2.3 样式约定

- 用 Tailwind 原子类，不要写 CSS 文件（除了 `index.css` 里的主题变量）
- 主题色是暖木棕：主色 `#8B5A2B`，通过 CSS 变量 `--primary` 管理
- 移动端用 `md:` 断点区分，底部导航只在 `md:hidden` 显示
- 组件用 `src/components/ui/` 下的 Radix 封装，不要原生 `<button>`

### 2.4 路由约定

- 用 HashRouter，路径是 `/#/records` 这种格式
- 新增页面：在 `app.tsx` 加 Route，在 `Header.tsx` 和 `Layout.tsx` 的导航数组里加项

### 2.5 构建约定

- `npm run build` = `tsc -p tsconfig.app.json && vite build`，类型检查不通过会构建失败
- `base: './'` 确保静态资源相对路径正确
- **必须用 `@tailwindcss/vite` 插件**，缺少会导致零样式（白屏/纯文本）

---

## 3. 常见修改任务速查

### 3.1 新增一个费用分类

1. `src/data/input-number.ts`：在 `ExpenseCategory` 联合类型加新值
2. `src/data/category-config.ts`：加 `CATEGORY_LABELS`、`CATEGORY_ICONS`、`SUBCATEGORY_SUGGESTIONS`、`CHART_COLORS`
3. `src/data/budget.ts`：在 `DEFAULT_BUDGET_CONFIG.categoryBudgets` 加新分类
4. `src/components/Header.tsx`：PDF 导出的 `categoryTotals` 初始化对象加新分类
5. 类型检查 + push 部署

### 3.2 新增待办事项

1. `src/data/todo-config.ts`：在对应分类的 `makeItems()` 数组里加文字
2. 注意：item id 是 `${categoryId}_${index+1}`，新增会改变后续 id，可能影响已存的 status map——尽量在末尾加
3. push 部署，用户端刷新后新事项自动出现（状态默认 pending）

### 3.3 修改页面布局/样式

1. 找到 `src/pages/` 下对应页面组件
2. 用 Tailwind 类修改
3. 本地 `npm run dev` 预览，确认后 push

### 3.4 新增导出格式

1. 在 `Header.tsx` 加按钮和处理函数
2. 数据从 `useExpense()` 获取
3. 用 `src/lib/utils.ts` 的 `exportBackupJSON` 或自定义 Blob 下载

### 3.5 修改 AI 分析逻辑

1. 前端在 `src/components/AiAnalysisDialog.tsx`，POST 数据到 `/api/analyze`
2. 后端在 `functions/api/analyze.ts`，用环境变量 `DEEPSEEK_API_KEY` 调用 DeepSeek API
3. API Key **不能**存前端或 KV，必须存 Cloudflare 加密环境变量（Settings → Environment variables → Encrypt）
4. 已加频率限制：每 IP 每分钟 10 次（用 KV 存计数）
5. 换其他 AI（豆包/通义/GPT）只需改 `analyze.ts` 里的 `DEEPSEEK_API_BASE` 和 `DEEPSEEK_MODEL`

### 3.6 修改云端同步逻辑

1. 核心在 `src/hooks/use-expense.tsx` 的三个 useEffect：
   - 启动拉取（`fetchCloudData`）
   - 首次上传（`initialSyncDone` 触发）
   - 防抖保存（监听数据变化，1.5s 后 `saveCloudData`）
2. API 封装在 `src/lib/api.ts`
3. 后端在 `functions/api/data.ts`（一般不需要改）

---

## 4. 容易踩的坑（血泪教训）

| 坑 | 现象 | 解决 |
|---|---|---|
| 缺少 `@tailwindcss/vite` 插件 | 页面纯文本无样式 | `vite.config.ts` 必须 `import tailwindcss from '@tailwindcss/vite'` 并加入 plugins |
| `dist` 被进程锁定 | `vite build` 报 rmdirSync EPERM | 停掉 `npm run preview` 进程，或重启后再构建 |
| PDF 中文乱码 | jspdf 直接 drawText 中文是方块 | 必须用 html2canvas 先转图片再进 PDF |
| 双击 index.html 白屏 | file:// 协议 ES Module CORS | 必须用服务器（`npm run preview` 或 Cloudflare Pages） |
| 空对象误判为有数据 | 本地数据被云端 `{}` 覆盖 | 判断 `todoStatus` 必须 `Object.keys().length > 0` |
| GitHub push 超时 | `Failed to connect to github.com:443` | 国内网络不稳定，多试几次；或配置 git 代理 |
| KV 未绑定 | API 返回 `KV namespace DECO_DATA not bound` | Cloudflare Dashboard → Pages → Settings → Functions → KV bindings 加 DECO_DATA |
| 改了 KV 绑定不生效 | 绑定后 API 仍报错 | 需要重新部署（Retry deployment），绑定只在部署时注入 |
| Vercel 国内不可用 | *.vercel.app 连接超时 | 用 Cloudflare Pages（pages.dev 国内可达） |
| PowerShell 用 `&&` 报错 | `&&` 不是有效语句分隔符 | PowerShell 用 `;` 或分两行 |

---

## 5. 部署与验证流程

### 5.1 部署（自动）

```bash
git add -A
git commit -m "描述修改"
git push
# Cloudflare Pages 自动构建，约 1-2 分钟
```

### 5.2 验证清单

部署完成后，按以下顺序验证：

1. **页面可访问**：`curl -s -o /dev/null -w "%{http_code}" https://decoration-app.pages.dev` → 200
2. **API 可访问**：`curl https://decoration-app.pages.dev/api/data` → 返回 JSON（不是 500）
3. **页面渲染**：浏览器打开，确认有暖木棕配色、导航、图表
4. **数据同步**：
   - 浏览器打开页面，等 3 秒
   - `curl https://decoration-app.pages.dev/api/data` 确认有 records 数据
   - 清除浏览器 localStorage 后刷新，确认数据从云端恢复
5. **导出功能**：点 PDF/CSV/备份按钮，确认文件下载且内容正确
6. **多端同步**：手机打开同一网址，确认数据一致

### 5.3 本地开发

```bash
cd decoration-app
npm install
npm run dev          # http://localhost:5173
# 注意：本地 dev 模式下 /api/data 不可用（Pages Function 只在 Cloudflare 环境运行）
# 本地调试云端同步需要：npx wrangler pages dev dist
```

---

## 6. 数据结构速查

### IExpenseRecord（费用记录）
```typescript
{
  id: string;              // rec_${Date.now()}_${random}
  date: string;            // YYYY-MM-DD
  category: ExpenseCategory; // design|hardware|main_material|soft_furnishing|appliance|labor|other
  subCategory: string;     // 自由文本，有建议列表
  amount: number;
  paymentMethod: PaymentMethod; // cash|wechat|alipay|bank_card|other
  merchant: string;
  remark: string;
  createdAt: number;       // 时间戳
  source: 'mock' | 'user';
}
```

### IBudgetConfig（预算）
```typescript
{
  totalBudget: number;
  categoryBudgets: Record<ExpenseCategory, number>;
}
```

### TodoStatus（待办状态）
```typescript
'done' | 'in_progress' | 'pending' | 'not_applicable'
// 完成度 = done / (总数 - not_applicable)
```

### CloudData（云端存储的完整数据）
```typescript
{
  version: 1;
  updatedAt: string;       // ISO 时间
  records: IExpenseRecord[];
  budget: IBudgetConfig;
  todoStatus: Record<string, TodoStatus>;  // key 是 item.id
  aiConfig: { apiKey: string; model: string; apiBase: string };
}
```

---

## 7. localStorage Keys（离线缓存）

| Key | 内容 |
|---|---|
| `__app_decoration_expense_records` | 费用记录数组 |
| `__app_decoration_budget_config` | 预算配置 |
| `__app_decoration_todo_items` | 待办状态 map（只存 status） |
| `__app_decoration_ai_config` | AI 配置 |

---

## 8. 给 AI 的操作原则

1. **先读再改**：修改任何文件前，先用 Read 读完整内容，不要凭记忆改
2. **类型先行**：改数据结构先改类型定义，TS 报错会指引你改完所有关联处
3. **小步提交**：每次修改后 `npm run build`（或至少 `tsc --noEmit`）验证类型
4. **部署后验证**：push 后等 2 分钟，用 curl 验证页面和 API
5. **不破坏现有功能**：新增功能时，不要改现有导出格式、数据结构的字段名（会导致旧备份无法导入）
6. **用户偏好**：全中文界面；暖木棕主题；标题后缀"维佳关山郡1002"不可去掉；免费方案优先
