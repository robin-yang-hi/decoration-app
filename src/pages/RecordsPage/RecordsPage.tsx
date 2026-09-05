import { useState, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CalendarDays, TrendingDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Search, Plus, Edit2, Trash2, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { useExpense } from '@/hooks/use-expense';
import { CATEGORY_LABELS, SUBCATEGORY_SUGGESTIONS, PAYMENT_LABELS } from '@/data/category-config';
import { formatCurrency } from '@/lib/utils';
import type { ExpenseCategory, PaymentMethod, IExpenseRecord } from '@/data/input-number';

const categoryEnum: [ExpenseCategory, ...ExpenseCategory[]] = [
  'design', 'hardware', 'main_material', 'soft_furnishing', 'appliance', 'labor', 'other',
];
const paymentMethodEnum: [PaymentMethod, ...PaymentMethod[]] = [
  'cash', 'wechat', 'alipay', 'bank_card', 'other',
];

const formSchema = z.object({
  date: z.string().min(1, '请选择日期'),
  category: z.enum(categoryEnum, { message: '请选择费用类别' }),
  subCategory: z.string().min(1, '请输入项目名称'),
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
    message: '金额必须大于 0',
  }),
  paymentMethod: z.enum(paymentMethodEnum, { message: '请选择支付方式' }),
  merchant: z.string(),
  remark: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export default function RecordsPage() {
  const { records, addRecord, updateRecord, deleteRecord } = useExpense();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<IExpenseRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [keyword, setKeyword] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      category: 'main_material' as ExpenseCategory,
      subCategory: '',
      amount: '',
      paymentMethod: 'alipay' as PaymentMethod,
      merchant: '',
      remark: '',
    },
  });

  const openAddDialog = () => {
    setEditingRecord(null);
    form.reset({
      date: new Date().toISOString().slice(0, 10),
      category: 'main_material',
      subCategory: '',
      amount: '',
      paymentMethod: 'alipay',
      merchant: '',
      remark: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (record: IExpenseRecord) => {
    setEditingRecord(record);
    form.reset({
      date: record.date,
      category: record.category,
      subCategory: record.subCategory,
      amount: String(record.amount),
      paymentMethod: record.paymentMethod,
      merchant: record.merchant,
      remark: record.remark,
    });
    setDialogOpen(true);
  };

  const onSubmit = (values: FormData) => {
    const amountNum = Number(values.amount);
    const payload = {
      date: values.date,
      category: values.category,
      subCategory: values.subCategory,
      amount: amountNum,
      paymentMethod: values.paymentMethod,
      merchant: values.merchant,
      remark: values.remark,
    };
    if (editingRecord) {
      updateRecord(editingRecord.id, payload);
      toast.success('记录已更新');
    } else {
      addRecord(payload);
      toast.success('记录已添加');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteRecord(deleteId);
      toast.success('记录已删除');
      setDeleteId(null);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (keyword) {
        const kw = keyword.toLowerCase();
        if (
          !r.subCategory.toLowerCase().includes(kw) &&
          !r.merchant.toLowerCase().includes(kw) &&
          !r.remark.toLowerCase().includes(kw)
        ) return false;
      }
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }, [records, categoryFilter, keyword, dateFrom, dateTo]);

  const hasActiveFilters = categoryFilter !== 'all' || keyword || dateFrom || dateTo;

  const clearFilters = () => {
    setCategoryFilter('all');
    setKeyword('');
    setDateFrom('');
    setDateTo('');
  };

  const currentCategory = form.watch('category') as ExpenseCategory;
  const subCategorySuggestions = SUBCATEGORY_SUGGESTIONS[currentCategory] || [];

  // 按月份分组
  const groupedRecords = useMemo(() => {
    const map = new Map<string, { records: IExpenseRecord[]; total: number }>();
    filteredRecords.forEach((r) => {
      const month = r.date.slice(0, 7);
      if (!map.has(month)) map.set(month, { records: [], total: 0 });
      const group = map.get(month)!;
      group.records.push(r);
      group.total += r.amount;
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, data]) => ({ month, ...data }));
  }, [filteredRecords]);

  function formatMonthTitle(month: string): string {
    const [y, m] = month.split('-');
    return `${y}年${parseInt(m, 10)}月`;
  }

  return (
    <div className="min-h-screen pb-20 md:pb-12">
      <main className="space-y-6">
        {/* 标题 */}
        <section className="w-full py-8 md:py-10">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">费用记录</h1>
                <p className="text-muted-foreground mt-1">
                  按月份分组查看所有装修花费，共 {records.length} 条记录
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="size-4" />
                  筛选
                  {hasActiveFilters && (
                    <Badge className="ml-1 h-5 px-1.5 min-w-[1.25rem] text-center bg-primary text-primary-foreground">
                      {[categoryFilter !== 'all', !!keyword, !!dateFrom, !!dateTo].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openAddDialog}>
                      <Plus className="size-4" />
                      新增记录
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          </div>
        </section>

        {/* 筛选区 */}
        {showFilters && (
          <section className="w-full">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
              <Card className="border-border/40">
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative w-full">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="search"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="搜索项目/商家/备注"
                        className="bg-background pl-9"
                      />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="全部类别" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部类别</SelectItem>
                        {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {CATEGORY_LABELS[cat]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      placeholder="开始日期"
                    />
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      placeholder="结束日期"
                    />
                  </div>
                  {hasActiveFilters && (
                    <div className="flex justify-end mt-3">
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="size-3.5" />
                        清除筛选
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* 按月份分组的记录列表 */}
        <section className="w-full pb-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-8">
            {groupedRecords.length > 0 ? (
              groupedRecords.map((group) => (
                <Card key={group.month} className="border-border/40 overflow-hidden">
                  {/* 月份标题栏 */}
                  <div className="bg-gradient-to-r from-accent/60 via-accent/30 to-transparent border-b border-border/40 px-4 md:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-4 text-primary shrink-0" />
                      <h3 className="text-base font-semibold text-foreground">
                        {formatMonthTitle(group.month)}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {group.records.length} 笔
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingDown className="size-3.5 text-primary shrink-0" />
                      <span className="text-sm font-semibold text-primary tabular-nums">
                        ¥{formatCurrency(group.total)}
                      </span>
                    </div>
                  </div>

                  {/* 当月记录表格 */}
                  <CardContent className="p-0">
                    <div className="w-full overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead className="whitespace-nowrap">日期</TableHead>
                            <TableHead className="whitespace-nowrap">类别</TableHead>
                            <TableHead className="whitespace-nowrap">项目名称</TableHead>
                            <TableHead className="whitespace-nowrap">商家</TableHead>
                            <TableHead className="whitespace-nowrap text-right">金额</TableHead>
                            <TableHead className="whitespace-nowrap">支付方式</TableHead>
                            <TableHead className="whitespace-nowrap text-right">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.records.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="whitespace-nowrap text-sm">{r.date}</TableCell>
                              <TableCell className="whitespace-nowrap">
                                <Badge variant="outline" className="text-xs">
                                  {CATEGORY_LABELS[r.category]}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="block truncate max-w-[180px]">{r.subCategory}</span>
                              </TableCell>
                              <TableCell>
                                <span className="block truncate max-w-[160px] text-muted-foreground">
                                  {r.merchant || '—'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-semibold tabular-nums whitespace-nowrap">
                                ¥{formatCurrency(r.amount)}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                                {PAYMENT_LABELS[r.paymentMethod]}
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(r)}>
                                    <Edit2 className="size-3.5" />
                                  </Button>
                                  <AlertDialog open={deleteId === r.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(r.id)}>
                                        <Trash2 className="size-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>确定删除这条记录吗？</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          删除后将无法恢复。项目：{r.subCategory}，金额：¥{formatCurrency(r.amount)}
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>取消</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                          确定删除
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-border/40">
                <CardContent className="p-0">
                  <div className="py-20 text-center">
                    <div className="size-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                      <Search className="size-7 text-muted-foreground" />
                    </div>
                    <div className="text-muted-foreground mb-2">暂无匹配的费用记录</div>
                    <div className="text-sm text-muted-foreground/70 mb-4">
                      {hasActiveFilters ? '试试调整筛选条件' : '点击右上方新增记录，开始记录你的第一笔装修花费'}
                    </div>
                    {!hasActiveFilters && (
                      <Button onClick={openAddDialog}>
                        <Plus className="size-4" />
                        新增记录
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>

      {/* 新增/编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRecord ? '编辑费用记录' : '新增费用记录'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>日期 <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>金额（元） <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>费用类别 <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((cat) => (
                            <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>支付方式</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((m) => (
                            <SelectItem key={m} value={m}>{PAYMENT_LABELS[m]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="subCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>项目名称 <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="例如：瓷砖、沙发、水电改造" {...field} />
                    </FormControl>
                    {subCategorySuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {subCategorySuggestions.map((s) => (
                          <Badge
                            key={s}
                            variant="outline"
                            className="cursor-pointer hover:bg-accent"
                            onClick={() => form.setValue('subCategory', s)}
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="merchant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>商家/供应商</FormLabel>
                    <FormControl><Input placeholder="可选" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="remark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>备注</FormLabel>
                    <FormControl><Textarea placeholder="可选，填写相关说明" rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">取消</Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {editingRecord ? '保存修改' : '添加记录'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
