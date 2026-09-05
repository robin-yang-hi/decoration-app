import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useExpense } from '@/hooks/use-expense';
import { CATEGORY_LABELS, CHART_COLORS } from '@/data/category-config';
import { formatCurrency, formatShortCurrency } from '@/lib/utils';
import { TrendingUp, Receipt, Wallet, AlertTriangle, ArrowRight, Sparkles, CheckSquare } from 'lucide-react';
import type { ExpenseCategory } from '@/data/input-number';
import AiAnalysisDialog from '@/components/AiAnalysisDialog';

export default function OverviewPage() {
  const {
    records,
    budget,
    overallTodoProgress,
    todoCounts,
    categoryTodoProgress,
    todoCategories,
  } = useExpense();

  const totalSpent = useMemo(
    () => records.reduce((sum, r) => sum + r.amount, 0),
    [records],
  );
  const recordCount = records.length;

  const monthSpent = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return records
      .filter((r) => r.date.startsWith(currentMonth))
      .reduce((sum, r) => sum + r.amount, 0);
  }, [records]);

  const categoryTotals = useMemo(() => {
    const totals: Record<ExpenseCategory, number> = {
      design: 0, hardware: 0, main_material: 0, soft_furnishing: 0,
      appliance: 0, labor: 0, other: 0,
    };
    records.forEach((r) => { totals[r.category] += r.amount; });
    return totals;
  }, [records]);

  const monthlyData = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => {
      const month = r.date.slice(0, 7);
      map.set(month, (map.get(month) || 0) + r.amount);
    });
    const sorted = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return { months: sorted.map(([m]) => m), values: sorted.map(([, v]) => Number(v.toFixed(2))) };
  }, [records]);

  const overBudgetCategories = useMemo(() => {
    return (Object.keys(budget.categoryBudgets) as ExpenseCategory[]).filter(
      (cat) => budget.categoryBudgets[cat] > 0 && categoryTotals[cat] > budget.categoryBudgets[cat],
    );
  }, [budget.categoryBudgets, categoryTotals]);

  const totalBudgetPercent = budget.totalBudget > 0 ? (totalSpent / budget.totalBudget) * 100 : 0;
  const totalOverBudget = budget.totalBudget > 0 && totalSpent > budget.totalBudget;

  const pieOption: EChartsOption = useMemo(() => {
    const data = (Object.keys(categoryTotals) as ExpenseCategory[])
      .filter((cat) => categoryTotals[cat] > 0)
      .map((cat) => ({ name: CATEGORY_LABELS[cat], value: categoryTotals[cat] }));
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number; percent: number };
          return `${p.name}<br/>金额：¥${formatCurrency(p.value)}<br/>占比：${p.percent}%`;
        },
      },
      legend: { type: 'scroll', bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
      color: CHART_COLORS,
      series: [{
        name: '费用占比',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: { label: { show: false } },
        data,
      }],
    };
  }, [categoryTotals]);

  const barOption: EChartsOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const p = list[0] as { name: string; value: number };
          return `${p.name}<br/>支出：¥${formatCurrency(p.value)}`;
        },
      },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: monthlyData.months,
        axisLabel: { rotate: monthlyData.months.length > 6 ? 30 : 0 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: (value: number) => formatShortCurrency(value) },
      },
      color: CHART_COLORS[0],
      series: [{
        name: '月度支出',
        type: 'bar',
        barWidth: '50%',
        data: monthlyData.values,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      }],
    };
  }, [monthlyData]);

  const recentRecords = useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [records],
  );

  return (
    <div className="min-h-screen pb-20 md:pb-12">
      <main className="space-y-6 md:space-y-8">
        {/* Hero 区 */}
        <section className="w-full py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">装修费用总览</h1>
                <p className="text-muted-foreground mt-1">
                  一站式掌握装修花费与进度，数据存储在你的浏览器本地
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <div className="text-sm text-muted-foreground">累计已花费</div>
                  <div className="text-2xl font-bold text-primary tabular-nums">
                    ¥{formatShortCurrency(totalSpent)}
                  </div>
                </div>
                <AiAnalysisDialog />
              </div>
            </div>
          </div>
        </section>

        {/* KPI 卡片 */}
        <section className="w-full">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-border/40">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wallet className="size-5 text-primary" />
                    </div>
                    {totalOverBudget && <Badge variant="destructive" className="text-xs">超支</Badge>}
                  </div>
                  <div className="text-2xl font-bold text-foreground tabular-nums">
                    ¥{formatShortCurrency(totalSpent)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">总支出</div>
                </CardContent>
              </Card>

              <Card className="border-border/40">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="size-10 rounded-lg bg-secondary flex items-center justify-center">
                      <TrendingUp className="size-5 text-secondary-foreground" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground tabular-nums">
                    {totalBudgetPercent.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {budget.totalBudget > 0 ? '预算使用率' : '未设置预算'}
                  </div>
                  {budget.totalBudget > 0 && (
                    <Progress value={Math.min(totalBudgetPercent, 100)} className="mt-3 h-2" />
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/40">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="size-10 rounded-lg bg-accent flex items-center justify-center">
                      <Receipt className="size-5 text-accent-foreground" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground tabular-nums">
                    {recordCount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">记录笔数</div>
                </CardContent>
              </Card>

              <Card className="border-border/40">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="size-10 rounded-lg bg-success/15 flex items-center justify-center">
                      <CheckSquare className="size-5 text-success" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground tabular-nums">
                    {overallTodoProgress.toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">装修进度</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* 装修进度总览 */}
        <section className="w-full">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>装修进度总览</span>
                  <Link to="/progress" className="text-primary text-sm font-normal hover:underline">
                    查看详情 →
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 mb-4">
                  <div className="text-3xl font-bold text-primary tabular-nums">
                    {overallTodoProgress.toFixed(1)}%
                  </div>
                  <div className="flex-1">
                    <Progress value={overallTodoProgress} className="h-3" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                      <span>已完成 {todoCounts.done} 项</span>
                      <span>进行中 {todoCounts.inProgress} 项</span>
                      <span>待启动 {todoCounts.pending} 项</span>
                      <span>暂不涉及 {todoCounts.notApplicable} 项</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {todoCategories.slice(0, 5).map((cat) => {
                    const pct = categoryTodoProgress[cat.id] ?? 0;
                    return (
                      <div key={cat.id} className="text-center">
                        <div className="text-xs text-muted-foreground mb-1 truncate">{cat.icon} {cat.name}</div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-xs font-medium mt-1 tabular-nums">{pct.toFixed(0)}%</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 图表区 */}
        <section className="w-full">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 饼图 */}
              <Card className="border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">分类费用占比</CardTitle>
                  <CardDescription>按一级分类统计</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {totalSpent > 0 ? (
                      <ReactECharts option={pieOption} style={{ height: '100%' }} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        暂无数据
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 柱状图 */}
              <Card className="border-border/40 lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">月度支出趋势</CardTitle>
                  <CardDescription>按月份聚合</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {monthlyData.months.length > 0 ? (
                      <ReactECharts option={barOption} style={{ height: '100%' }} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        暂无数据
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* 预算执行 + 近期记录 */}
        <section className="w-full pb-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 预算执行 */}
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">预算执行</CardTitle>
                  <CardDescription>
                    <Link to="/budget" className="text-primary hover:underline text-xs">
                      前往设置 →
                    </Link>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {budget.totalBudget > 0 ? (
                    <>
                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-muted-foreground">总预算</span>
                          <span className="font-medium tabular-nums">
                            ¥{formatCurrency(budget.totalBudget)}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(totalBudgetPercent, 100)}
                          className={totalOverBudget ? 'bg-destructive/20 [&>div]:bg-destructive' : 'h-2'}
                        />
                        <div className="flex justify-between text-xs mt-1.5">
                          <span className="text-muted-foreground">
                            已花 ¥{formatShortCurrency(totalSpent)}
                          </span>
                          <span className={totalOverBudget ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                            {totalOverBudget
                              ? `超支 ¥${formatCurrency(totalSpent - budget.totalBudget)}`
                              : `剩 ¥${formatShortCurrency(budget.totalBudget - totalSpent)}`}
                          </span>
                        </div>
                      </div>
                      {overBudgetCategories.length > 0 && (
                        <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-xs">
                          <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
                          <div className="text-destructive">
                            <div className="font-medium mb-0.5">超支分类</div>
                            <div>{overBudgetCategories.map((c) => CATEGORY_LABELS[c]).join('、')}</div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <Sparkles className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">还没设置预算</p>
                      <Link to="/budget">
                        <Button variant="secondary" size="sm" className="mt-3">
                          去设置预算
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 近期记录 */}
              <Card className="border-border/40 lg:col-span-2">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">近期费用明细</CardTitle>
                    <CardDescription>最近 6 条记录</CardDescription>
                  </div>
                  <Link to="/records" className="text-primary text-sm hover:underline flex items-center gap-1">
                    查看全部 <ArrowRight className="size-3" />
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  {recentRecords.length > 0 ? (
                    <div className="divide-y divide-border/40">
                      {recentRecords.map((r) => (
                        <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                          <div className="size-8 rounded-md bg-accent/60 flex items-center justify-center text-base shrink-0">
                            {CATEGORY_LABELS[r.category][0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{r.subCategory}</div>
                            <div className="text-xs text-muted-foreground">
                              {CATEGORY_LABELS[r.category]} · {r.date}
                            </div>
                          </div>
                          <div className="text-sm font-semibold tabular-nums text-right shrink-0">
                            ¥{formatCurrency(r.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-muted-foreground text-sm">
                      暂无记录
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
