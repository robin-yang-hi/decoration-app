import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Sparkles, Loader2 } from 'lucide-react';
import { useExpense } from '@/hooks/use-expense';
import { CATEGORY_LABELS } from '@/data/category-config';
import { formatCurrency } from '@/lib/utils';
import type { ExpenseCategory } from '@/data/input-number';
import { toast } from 'sonner';

export default function AiAnalysisDialog() {
  const { records, budget } = useExpense();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');

  const handleAnalyze = async () => {
    if (records.length === 0) {
      toast.info('暂无费用记录可分析');
      return;
    }
    setLoading(true);
    setAnalysis('');

    // 本地计算的简单分析
    setTimeout(() => {
      const totalSpent = records.reduce((s, r) => s + r.amount, 0);
      const categoryTotals: Record<string, number> = {};
      records.forEach((r) => {
        categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.amount;
      });

      const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
      const topCategory = sorted[0];
      const topCategoryLabel = CATEGORY_LABELS[topCategory[0] as ExpenseCategory];
      const topCategoryPercent = totalSpent > 0 ? ((topCategory[1] / totalSpent) * 100).toFixed(1) : '0';

      const overBudget = budget.totalBudget > 0 && totalSpent > budget.totalBudget;
      const budgetPercent = budget.totalBudget > 0 ? ((totalSpent / budget.totalBudget) * 100).toFixed(1) : '0';

      const tips: string[] = [];
      if (overBudget) {
        tips.push('⚠️ 目前已超出总预算，建议重新审视非必要支出，优先保证硬装和主材质量。');
      } else if (Number(budgetPercent) > 80) {
        tips.push('⚡ 预算使用率已超过 80%，后续软装和家电部分请做好取舍规划。');
      } else {
        tips.push('✅ 预算控制良好，可以继续按计划推进。');
      }

      if (topCategory && Number(topCategoryPercent) > 40) {
        tips.push(`📊 ${topCategoryLabel}占比达到 ${topCategoryPercent}%，是目前最大的支出板块，建议重点关注该板块的后续花费。`);
      }

      tips.push('💡 建议定期回顾分类占比，及时调整预算分配，避免后期超支。');
      tips.push(`📝 当前共 ${records.length} 条记录，持续记账可以更好地掌握装修花费全貌。`);

      setAnalysis(`
## 装修费用分析报告

### 总览

- **累计总支出**：¥${formatCurrency(totalSpent)}
- **记录笔数**：${records.length} 笔
${budget.totalBudget > 0 ? `- **预算使用率**：${budgetPercent}%` : '- **预算状态**：尚未设置总预算'}

### 分类支出排行

${sorted.slice(0, 5).map(([cat, amt], i) => {
  const label = CATEGORY_LABELS[cat as ExpenseCategory];
  const pct = totalSpent > 0 ? ((amt / totalSpent) * 100).toFixed(1) : '0';
  return `${i + 1}. **${label}**：¥${formatCurrency(amt)}（${pct}%）`;
}).join('\n')}

### 建议

${tips.map((t, i) => `${i + 1}. ${t}`).join('\n')}

---
*以上分析基于您已记录的费用数据，仅供参考。*
      `.trim());
      setLoading(false);
    }, 800);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o) {
        handleAnalyze();
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <Sparkles className="size-4" />
          <span className="hidden sm:inline">AI 分析</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            费用智能分析
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          {loading && !analysis && (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="size-6 animate-spin mb-3 text-primary" />
              <p className="text-sm">正在分析您的装修花费数据...</p>
            </div>
          )}
          {analysis && (
            <article className="prose prose-sm max-w-none">
              {analysis.split('\n').map((line, i) => {
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(3)}</h2>;
                }
                if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-base font-semibold mt-3 mb-1.5">{line.slice(4)}</h3>;
                }
                if (line.startsWith('- ')) {
                  return <li key={i} className="text-sm ml-4 list-disc">{line.slice(2)}</li>;
                }
                if (/^\d+\.\s\*\*/.test(line)) {
                  return <div key={i} className="text-sm ml-4" dangerouslySetInnerHTML={{
                    __html: line.replace(/^\d+\.\s\*\*(.+?)\*\*：/, (_, m) => `${m}：`)
                      .replace(/（(\d+\.?\d*)%）/, '<span class="text-primary font-medium">（$1%）</span>')
                  }} />;
                }
                if (line.startsWith('---')) {
                  return <hr key={i} className="my-3 border-border" />;
                }
                if (line.trim() === '') return null;
                return <p key={i} className="text-sm text-foreground/90">{line.replace(/\*/g, '')}</p>;
              })}
            </article>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
