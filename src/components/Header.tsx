import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { PieChart, ListChecks, Wallet, Download, Upload, FileText, CheckSquare, Menu, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useExpense } from '@/hooks/use-expense';
import { exportBackupJSON, readFileAsText } from '@/lib/utils';
import { generateExpensePDF } from '@/lib/pdf-export';
import { CATEGORY_LABELS, PAYMENT_LABELS } from '@/data/category-config';
import { toast } from 'sonner';
import type { ExpenseCategory } from '@/data/input-number';
import { useIsMobile } from '@/hooks/use-mobile';

const NAV_ITEMS = [
  { path: '/', label: '费用总览', icon: PieChart },
  { path: '/records', label: '费用记录', icon: ListChecks },
  { path: '/budget', label: '预算设置', icon: Wallet },
  { path: '/progress', label: '装修进度', icon: CheckSquare },
];

export default function Header() {
  const {
    records,
    budget,
    todoCategories,
    overallTodoProgress,
    exportAllData,
    importAllData,
  } = useExpense();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState('');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportJSON = () => {
    const dataStr = exportAllData();
    const data = JSON.parse(dataStr);
    exportBackupJSON(data, `装修数据备份_${new Date().toISOString().slice(0, 10)}.json`);
    toast.success('已导出完整数据备份');
  };

  const handleExportPDF = async () => {
    const categoryTotals: Record<ExpenseCategory, number> = {
      design: 0, hardware: 0, main_material: 0, soft_furnishing: 0,
      appliance: 0, labor: 0, other: 0,
    };
    records.forEach((r) => {
      categoryTotals[r.category] += r.amount;
    });
    const totalSpent = records.reduce((s, r) => s + r.amount, 0);

    toast.loading('正在生成 PDF...');
    try {
      await generateExpensePDF({
        records,
        budget,
        todoCategories,
        overallTodoProgress,
        categoryTotals,
        totalSpent,
      });
      toast.success('PDF 已导出');
    } catch (err) {
      toast.error(`PDF 导出失败：${err instanceof Error ? err.message : String(err)}`);
    } finally {
      toast.dismiss();
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const parsed = JSON.parse(text);
      if (!parsed.records && !parsed.budget) {
        toast.error('文件格式不正确，未找到有效数据');
        return;
      }
      setPendingImportData(text);
      setImportConfirmOpen(true);
    } catch {
      toast.error('文件解析失败，请确认是从本工具导出的 JSON 备份文件');
    }
    e.target.value = '';
  };

  const confirmImport = () => {
    const result = importAllData(pendingImportData);
    if (result.success) {
      toast.success(result.message);
      setTimeout(() => window.location.reload(), 500);
    } else {
      toast.error(result.message);
    }
    setImportConfirmOpen(false);
    setPendingImportData('');
  };

  const handleExportRecordsCSV = () => {
    if (records.length === 0) {
      toast.info('暂无记录可导出');
      return;
    }
    const headers = ['日期', '类别', '子类别', '金额', '支付方式', '商家', '备注'];
    const rows = records.map((r) =>
      [r.date, CATEGORY_LABELS[r.category], r.subCategory, r.amount,
       PAYMENT_LABELS[r.paymentMethod], r.merchant, r.remark]
        .map((val) => {
          const s = String(val ?? '');
          if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        }).join(','),
    );
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `装修费用记录_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('已导出费用记录 CSV');
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                装
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-semibold text-foreground">装修费用管家</span>
                <span className="text-xs text-muted-foreground font-normal">维佳关山郡</span>
              </div>
            </div>
            {!isMobile && (
              <nav className="flex items-center gap-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-colors ${
                          isActive
                            ? 'bg-accent text-accent-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        }`
                      }
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {!isMobile ? (
              <>
                <button onClick={handleExportPDF} title="导出 PDF 报告"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                  <FileText className="size-4" />
                  <span className="hidden lg:inline">PDF</span>
                </button>
                <button onClick={handleExportRecordsCSV} title="导出费用记录 CSV"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                  <Download className="size-4" />
                  <span className="hidden lg:inline">CSV</span>
                </button>
                <button onClick={handleExportJSON} title="导出完整数据备份"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                  <Download className="size-4" />
                  <span className="hidden lg:inline">备份</span>
                </button>
                <button onClick={handleImportClick} title="从备份文件导入"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                  <Upload className="size-4" />
                  <span className="hidden lg:inline">导入</span>
                </button>
              </>
            ) : (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="secondary" size="sm">
                    <Menu className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-72">
                  <SheetHeader>
                    <SheetTitle>菜单</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1 mt-6">
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          end={item.path === '/'}
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors ${
                              isActive
                                ? 'bg-accent text-accent-foreground font-medium'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                            }`
                          }
                        >
                          <Icon className="size-5" />
                          {item.label}
                        </NavLink>
                      );
                    })}
                  </nav>
                  <div className="mt-6 pt-6 border-t border-border space-y-2">
                    <Button variant="secondary" className="w-full justify-start" onClick={handleExportPDF}>
                      <FileText className="size-4" />
                      导出 PDF
                    </Button>
                    <Button variant="secondary" className="w-full justify-start" onClick={handleExportJSON}>
                      <Download className="size-4" />
                      导出数据备份
                    </Button>
                    <Button variant="secondary" className="w-full justify-start" onClick={handleImportClick}>
                      <Upload className="size-4" />
                      导入备份
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>

        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </header>

      {/* 导入确认弹窗 */}
      <AlertDialog open={importConfirmOpen} onOpenChange={setImportConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认导入数据？</AlertDialogTitle>
            <AlertDialogDescription>
              导入后将覆盖现有的费用记录、预算配置和进度数据，此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport} className="bg-destructive hover:bg-destructive/90">
              确认导入
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
