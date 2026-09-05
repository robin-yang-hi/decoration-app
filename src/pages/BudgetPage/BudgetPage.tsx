import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from 'sonner';
import { Wallet, AlertTriangle, CheckCircle, Save, Sparkles } from 'lucide-react';
import { useExpense } from '@/hooks/use-expense';
import { CATEGORY_LABELS } from '@/data/category-config';
import { formatCurrency, formatShortCurrency } from '@/lib/utils';
import type { ExpenseCategory } from '@/data/input-number';
import type { IBudgetConfig } from '@/data/budget';
import { DEFAULT_BUDGET_CONFIG } from '@/data/budget';

export default function BudgetPage() {
  const { budget, saveBudget, records } = useExpense();
  const [localBudget, setLocalBudget] = useState<IBudgetConfig>(budget);
  const [hasChanges, setHasChanges] = useState(false);

  useMemo(() => {
    if (!hasChanges) setLocalBudget(budget);
  }, [budget.totalBudget]);

  const categoryTotals = useMemo(() => {
    const totals: Record<ExpenseCategory, number> = {
      design: 0, hardware: 0, main_material: 0, soft_furnishing: 0,
      appliance: 0, labor: 0, other: 0,
    };
    records.forEach((r) => { totals[r.category] += r.amount; });
    return totals;
  }, [records]);

  const totalSpent = useMemo(() => records.reduce((sum, r) => sum + r.amount, 0), [records]);

  const totalBudgetPercent = localBudget.totalBudget > 0
    ? (totalSpent / localBudget.totalBudget) * 100
    : 0;
  const totalOverBudget = localBudget.totalBudget > 0 && totalSpent > localBudget.totalBudget;

  const overBudgetCategories = useMemo(() => {
    return (Object.keys(localBudget.categoryBudgets) as ExpenseCategory[]).filter(
      (cat) =>
        localBudget.categoryBudgets[cat] > 0 &&
        categoryTotals[cat] > localBudget.categoryBudgets[cat],
    );
  }, [localBudget.categoryBudgets, categoryTotals]);

  const nearBudgetCategories = useMemo(() => {
    return (Object.keys(localBudget.categoryBudgets) as ExpenseCategory[]).filter((cat) => {
      const b = localBudget.categoryBudgets[cat];
      if (b <= 0) return false;
      const p = (categoryTotals[cat] / b) * 100;
      return p >= 80 && p <= 100;
    });
  }, [localBudget.categoryBudgets, categoryTotals]);

  const handleTotalBudgetChange = (value: string) => {
    const num = value === '' ? 0 : Number(value);
    if (isNaN(num)) return;
    setLocalBudget((prev) => ({ ...prev, totalBudget: num }));
    setHasChanges(true);
  };

  const handleCategoryBudgetChange = (cat: ExpenseCategory, value: string) => {
    const num = value === '' ? 0 : Number(value);
    if (isNaN(num)) return;
    setLocalBudget((prev) => ({
      ...prev,
      categoryBudgets: { ...prev.categoryBudgets, [cat]: num },
    }));
    setHasChanges(true);
  };

  const autoDistribute = () => {
    if (localBudget.totalBudget <= 0) {
      toast.warning('请先设置总预算金额');
      return;
    }
    const ratios: Record<ExpenseCategory, number> = {
      design: 0.05, hardware: 0.25, main_material: 0.25,
      soft_furnishing: 0.15, appliance: 0.1, labor: 0.15, other: 0.05,
    };
    const newBudgets = { ...localBudget.categoryBudgets };
    (Object.keys(ratios) as ExpenseCategory[]).forEach((cat) => {
      newBudgets[cat] = Math.round(localBudget.totalBudget * ratios[cat]);
    });
    setLocalBudget((prev) => ({ ...prev, categoryBudgets: newBudgets }));
    setHasChanges(true);
    toast.success('已按常见比例自动分配分类预算');
  };

  const handleSave = () => {
    saveBudget(localBudget);
    setHasChanges(false);
    toast.success('预算设置已保存');
  };

  const handleReset = () => {
    setLocalBudget(DEFAULT_BUDGET_CONFIG);
    setHasChanges(true);
  };

  function getBudgetStatus(percent: number) {
    if (percent >= 100) return { variant: 'bg-destructive', textClass: 'text-destructive', label: '超支' };
    if (percent >= 80) return { variant: 'bg-warning', textClass: 'text-warning', label: '接近' };
    return { variant: 'bg-success', textClass: 'text-success', label: '正常' };
  }

  return (
    <div className="min-h-screen pb-20 md:pb-12">
      <main className="space-y-6">
        <section className="w-full py-8 md:py-10">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">预算设置</h1>
                <p className="text-muted-foreground mt-1">
                  设置总预算和各分类预算，实时监控花费进度
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && <Badge variant="secondary" className="text-xs">有未保存的修改</Badge>}
                <Button onClick={handleSave} disabled={!hasChanges}>
                  <Save className="size-4" />
                  保存设置
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 超支提醒汇总 */}
        <section className="w-full">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            {overBudgetCategories.length > 0 ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-5 flex items-start gap-3">
                <AlertTriangle className="size-6 text-destructive shrink-0" />
                <div>
                  <div className="font-semibold text-destructive text-base">
                    有 {overBudgetCategories.length} 个分类已超支
                  </div>
                  <div className="text-sm text-destructive/80 mt-1">
                    超支分类：{overBudgetCategories.map((c) => CATEGORY_LABELS[c]).join('、')}
                  </div>
                  <div className="text-sm text-destructive/80 mt-1">
                    总超支金额：
                    <span className="font-semibold">
                      ¥{formatCurrency(
                        overBudgetCategories.reduce(
                          (sum, c) => sum + (categoryTotals[c] - localBudget.categoryBudgets[c]),
                          0,
                        ),
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ) : localBudget.totalBudget > 0 ? (
              <div className="bg-success/10 border border-success/20 rounded-xl p-5 flex items-start gap-3">
                <CheckCircle className="size-6 text-success shrink-0" />
                <div>
                  <div className="font-semibold text-success text-base">预算控制良好</div>
                  <div className="text-sm text-success/80 mt-1">
                    {nearBudgetCategories.length > 0
                      ? `注意：${nearBudgetCategories.map((c) => CATEGORY_LABELS[c]).join('、')} 接近预算上限，请合理安排后续支出`
                      : '所有分类均在预算范围内，继续保持！'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 border border-border rounded-xl p-5 flex items-start gap-3">
                <Wallet className="size-6 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-medium text-foreground">还没设置预算</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    填写总预算金额，开始监控你的装修花费
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 总预算 */}
        <section className="w-full">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">总预算</CardTitle>
                <CardDescription>
                  设置装修总预算金额，系统会自动计算使用率
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex-1 w-full">
                    <label className="text-sm text-muted-foreground block mb-1.5">总预算金额（元）</label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={localBudget.totalBudget || ''}
                      onChange={(e) => handleTotalBudgetChange(e.target.value)}
                      placeholder="请输入总预算金额"
                      className="text-lg font-semibold tabular-nums"
                    />
                  </div>
                  <Button variant="secondary" onClick={autoDistribute} className="shrink-0">
                    <Sparkles className="size-4" />
                    自动分配
                  </Button>
                  <Button variant="ghost" onClick={handleReset} className="shrink-0 text-muted-foreground">
                    重置
                  </Button>
                </div>
                {localBudget.totalBudget > 0 && (
                  <div className="pt-2">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">已花费</span>
                      <span className={totalOverBudget ? 'text-destructive font-medium' : 'text-foreground font-medium'}>
                        ¥{formatCurrency(totalSpent)} / ¥{formatCurrency(localBudget.totalBudget)}
                        <span className="text-muted-foreground font-normal ml-2">
                          ({totalBudgetPercent.toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                    <Progress value={Math.min(totalBudgetPercent, 100)} className="h-3" />
                    <div className="flex justify-between text-xs mt-2">
                      <span className={totalOverBudget ? 'text-destructive' : 'text-muted-foreground'}>
                        {totalOverBudget
                          ? `已超支 ¥${formatCurrency(totalSpent - localBudget.totalBudget)}`
                          : `剩余 ¥${formatCurrency(localBudget.totalBudget - totalSpent)}`}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 分类预算 */}
        <section className="w-full pb-12">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">分类预算</CardTitle>
                <CardDescription>展开各分类可单独设置预算金额</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((cat) => {
                    const spent = categoryTotals[cat];
                    const catBudget = localBudget.categoryBudgets[cat];
                    const percent = catBudget > 0 ? Math.min((spent / catBudget) * 100, 100) : 0;
                    const over = catBudget > 0 && spent > catBudget;
                    const status = catBudget > 0 ? getBudgetStatus((spent / catBudget) * 100) : null;

                    return (
                      <AccordionItem key={cat} value={cat}>
                        <AccordionTrigger className="py-3 hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3">
                              <span className="text-base">{CATEGORY_LABELS[cat]}</span>
                              {status && (
                                <Badge variant="outline" className={`text-xs ${status.textClass} border-current`}>
                                  {status.label}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm font-medium tabular-nums">
                              ¥{formatShortCurrency(spent)}
                              {catBudget > 0 && <span className="text-muted-foreground font-normal"> / ¥{formatShortCurrency(catBudget)}</span>}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                          <div className="space-y-3">
                            {catBudget > 0 && (
                              <div>
                                <Progress value={percent} className={over ? '[&>div]:bg-destructive' : ''} />
                                <div className="flex justify-between text-xs mt-1.5">
                                  <span className="text-muted-foreground">
                                    已花费 {catBudget > 0 ? ((spent / catBudget) * 100).toFixed(1) : 0}%
                                  </span>
                                  <span className={over ? 'text-destructive' : 'text-muted-foreground'}>
                                    {over
                                      ? `超支 ¥${formatCurrency(spent - catBudget)}`
                                      : `剩 ¥${formatCurrency(catBudget - spent)}`}
                                  </span>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <label className="text-xs text-muted-foreground block mb-1">预算金额（元）</label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={catBudget || ''}
                                  onChange={(e) => handleCategoryBudgetChange(cat, e.target.value)}
                                  placeholder="0 = 不设预算"
                                  className="tabular-nums"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-xs text-muted-foreground block mb-1">已花费</label>
                                <div className="h-10 flex items-center px-3 text-sm font-medium tabular-nums bg-muted/30 rounded-md">
                                  ¥{formatCurrency(spent)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
