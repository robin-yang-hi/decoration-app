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

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records, budget }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `请求失败（${res.status}）`);
      }
      setAnalysis(data.content || '分析结果为空，请重试。');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`AI 分析失败：${msg}`);
      setAnalysis(`分析失败：${msg}\n\n可能原因：\n- 管理员尚未配置 DeepSeek API Key\n- 网络连接异常\n- 调用过于频繁`);
    } finally {
      setLoading(false);
    }
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
