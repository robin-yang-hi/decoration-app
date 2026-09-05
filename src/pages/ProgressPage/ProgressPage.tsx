import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useExpense } from '@/hooks/use-expense';
import type { TodoStatus } from '@/data/todo-config';
import { TODO_STATUS_LABELS } from '@/data/todo-config';
import { CheckCircle2, Clock, Loader2, Ban, RotateCcw, MoreHorizontal } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const STATUS_STYLES: Record<TodoStatus, string> = {
  done: 'bg-success/15 text-success border-success/30 hover:bg-success/25',
  in_progress: 'bg-info/15 text-info border-info/30 hover:bg-info/25',
  pending: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
  not_applicable:
    'bg-transparent text-muted-foreground/60 border-border/40 line-through hover:bg-muted/30',
};

const STATUS_ICONS: Record<TodoStatus, typeof CheckCircle2> = {
  done: CheckCircle2,
  in_progress: Loader2,
  pending: Clock,
  not_applicable: Ban,
};

export default function ProgressPage() {
  const {
    todoCategories,
    todoLoading,
    updateTodoStatus,
    resetTodoAll,
    overallTodoProgress,
    categoryTodoProgress,
    todoCounts,
  } = useExpense();

  const [resetOpen, setResetOpen] = useState(false);

  const sortedCategories = useMemo(
    () =>
      [...todoCategories].sort((a, b) => {
        const pa = categoryTodoProgress[a.id] ?? 0;
        const pb = categoryTodoProgress[b.id] ?? 0;
        return pb - pa;
      }),
    [todoCategories, categoryTodoProgress],
  );

  const handleStatusChange = (itemId: string, status: TodoStatus) => {
    updateTodoStatus(itemId, status);
    if (status === 'done') toast.success('任务已标记完成');
    else if (status === 'in_progress') toast.info('任务进行中');
  };

  const handleReset = () => {
    resetTodoAll();
    toast.success('已重置所有待办状态');
    setResetOpen(false);
  };

  if (todoLoading) {
    return (
      <div className="min-h-screen pb-20 md:pb-12">
        <main className="space-y-6 py-12">
          <div className="max-w-5xl mx-auto px-4 md:px-6 text-center text-muted-foreground">
            加载中...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-12">
      <main className="space-y-6">
        <section className="w-full py-8 md:py-10">
          <div className="max-w-5xl mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">装修进度</h1>
                <p className="text-muted-foreground mt-1">
                  按类别管理装修全流程待办事项，实时掌握进度
                </p>
              </div>
              <div className="flex items-center gap-2">
                <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="secondary" size="sm">
                      <RotateCcw className="size-4" />
                      重置进度
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认重置所有待办？</AlertDialogTitle>
                      <AlertDialogDescription>
                        此操作将所有事项状态重置为"待启动"，且无法撤销。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={handleReset}>确认重置</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </section>

        {/* 整体完成度 */}
        <section className="w-full">
          <div className="max-w-5xl mx-auto px-4 md:px-6">
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">整体完成度</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-primary tabular-nums">
                    {overallTodoProgress.toFixed(1)}%
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>
                      已完成 <span className="font-semibold text-foreground">{todoCounts.done}</span>
                      {' '}/ 总计 <span className="font-semibold text-foreground">{todoCounts.total}</span> 项
                    </div>
                    <div className="mt-1">
                      暂不涉及 {todoCounts.notApplicable} 项 · 进行中 {todoCounts.inProgress} 项
                    </div>
                  </div>
                </div>
                <Progress value={overallTodoProgress} className="h-3" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div className="rounded-lg bg-success/10 p-3 text-center">
                    <div className="text-xl font-bold text-success">{todoCounts.done}</div>
                    <div className="text-xs text-muted-foreground mt-1">已完成</div>
                  </div>
                  <div className="rounded-lg bg-info/10 p-3 text-center">
                    <div className="text-xl font-bold text-info">{todoCounts.inProgress}</div>
                    <div className="text-xs text-muted-foreground mt-1">进行中</div>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <div className="text-xl font-bold text-foreground">{todoCounts.pending}</div>
                    <div className="text-xs text-muted-foreground mt-1">待启动</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <div className="text-xl font-bold text-muted-foreground">{todoCounts.notApplicable}</div>
                    <div className="text-xs text-muted-foreground mt-1">暂不涉及</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 各分类进度 + 待办事项 */}
        <section className="w-full pb-12">
          <div className="max-w-5xl mx-auto px-4 md:px-6">
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="text-base">待办事项</CardTitle>
              </CardHeader>
              <CardContent className="px-1 md:px-2">
                <Accordion type="multiple" className="w-full">
                  {sortedCategories.map((cat) => {
                    const pct = categoryTodoProgress[cat.id] ?? 0;
                    let catDone = 0;
                    let catTotal = 0;
                    cat.items.forEach((item) => {
                      if (item.status !== 'not_applicable') {
                        catTotal += 1;
                        if (item.status === 'done') catDone += 1;
                      }
                    });

                    return (
                      <AccordionItem key={cat.id} value={cat.id}>
                        <AccordionTrigger className="py-3 hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{cat.icon}</span>
                              <span className="font-medium">{cat.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {catDone}/{catTotal}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium tabular-nums text-muted-foreground">
                                {pct.toFixed(0)}%
                              </span>
                              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                          <div className="space-y-2">
                            {cat.items.map((item) => {
                              const StatusIcon = STATUS_ICONS[item.status];
                              return (
                                <div
                                  key={item.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${STATUS_STYLES[item.status]}`}
                                >
                                  <StatusIcon
                                    className={`size-4 shrink-0 ${item.status === 'in_progress' ? 'animate-spin' : ''}`}
                                  />
                                  <span className="flex-1 text-sm">{item.text}</span>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <MoreHorizontal className="size-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-36">
                                      <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'pending')}>
                                        <Clock className="size-3.5 mr-2" />
                                        待启动
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'in_progress')}>
                                        <Loader2 className="size-3.5 mr-2" />
                                        进行中
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'done')}>
                                        <CheckCircle2 className="size-3.5 mr-2" />
                                        已完成
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'not_applicable')}>
                                        <Ban className="size-3.5 mr-2" />
                                        暂不涉及
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              );
                            })}
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
