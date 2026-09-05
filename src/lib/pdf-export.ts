import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { IExpenseRecord } from '@/data/input-number';
import type { IBudgetConfig } from '@/data/budget';
import type { ExpenseCategory } from '@/data/input-number';
import type { ITodoCategory } from '@/data/todo-config';
import { CATEGORY_LABELS, PAYMENT_LABELS } from '@/data/category-config';
import { formatCurrency } from '@/lib/utils';

interface PDFExportParams {
  records: IExpenseRecord[];
  budget: IBudgetConfig;
  todoCategories: ITodoCategory[];
  overallTodoProgress: number;
  categoryTotals: Record<ExpenseCategory, number>;
  totalSpent: number;
}

function buildPDFContent(params: PDFExportParams): HTMLDivElement {
  const { records, budget, categoryTotals, totalSpent, overallTodoProgress, todoCategories } = params;
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 794px;
    background: #ffffff;
    padding: 40px;
    font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #1a1a1a;
    line-height: 1.6;
  `;

  const totalBudgetPercent = budget.totalBudget > 0 ? (totalSpent / budget.totalBudget) * 100 : 0;

  let html = `
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #8B5A2B;">
      <h1 style="font-size: 28px; font-weight: 700; color: #8B5A2B; margin: 0;">装修费用报告</h1>
      <p style="font-size: 14px; color: #666; margin-top: 8px;">维佳关山郡 · ${new Date().toLocaleDateString('zh-CN')}</p>
    </div>

    <h2 style="font-size: 18px; font-weight: 600; color: #8B5A2B; margin: 24px 0 16px; padding-left: 10px; border-left: 4px solid #8B5A2B;">一、费用总览</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
      <div style="background: #faf6f0; padding: 16px; border-radius: 8px;">
        <div style="font-size: 12px; color: #888;">累计支出</div>
        <div style="font-size: 22px; font-weight: 700; color: #8B5A2B;">¥${formatCurrency(totalSpent)}</div>
      </div>
      <div style="background: #faf6f0; padding: 16px; border-radius: 8px;">
        <div style="font-size: 12px; color: #888;">总预算</div>
        <div style="font-size: 22px; font-weight: 700; color: #333;">¥${formatCurrency(budget.totalBudget)}</div>
      </div>
      <div style="background: #faf6f0; padding: 16px; border-radius: 8px;">
        <div style="font-size: 12px; color: #888;">预算使用率</div>
        <div style="font-size: 22px; font-weight: 700; color: ${totalBudgetPercent > 100 ? '#d32f2f' : '#388e3c'};">${totalBudgetPercent.toFixed(1)}%</div>
      </div>
      <div style="background: #faf6f0; padding: 16px; border-radius: 8px;">
        <div style="font-size: 12px; color: #888;">记录笔数 / 装修进度</div>
        <div style="font-size: 22px; font-weight: 700; color: #333;">${records.length} 笔 / ${overallTodoProgress.toFixed(0)}%</div>
      </div>
    </div>
  `;

  // 分类明细
  html += `<h2 style="font-size: 18px; font-weight: 600; color: #8B5A2B; margin: 24px 0 16px; padding-left: 10px; border-left: 4px solid #8B5A2B;">二、各板块费用明细</h2>`;
  html += `<table style="width: 100%; border-collapse: collapse; font-size: 13px;">
    <thead>
      <tr style="background: #f5efe6;">
        <th style="padding: 10px 12px; text-align: left; border: 1px solid #e0d5c5;">类别</th>
        <th style="padding: 10px 12px; text-align: right; border: 1px solid #e0d5c5;">已花费</th>
        <th style="padding: 10px 12px; text-align: right; border: 1px solid #e0d5c5;">预算</th>
        <th style="padding: 10px 12px; text-align: right; border: 1px solid #e0d5c5;">使用率</th>
        <th style="padding: 10px 12px; text-align: right; border: 1px solid #e0d5c5;">占比</th>
      </tr>
    </thead><tbody>`;

  (Object.keys(categoryTotals) as ExpenseCategory[]).forEach((cat) => {
    const amount = categoryTotals[cat];
    const catBudget = budget.categoryBudgets[cat];
    const usage = catBudget > 0 ? (amount / catBudget) * 100 : 0;
    const percent = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
    const over = catBudget > 0 && amount > catBudget;
    html += `<tr>
      <td style="padding: 8px 12px; border: 1px solid #e8e0d5;">${CATEGORY_LABELS[cat]}</td>
      <td style="padding: 8px 12px; text-align: right; border: 1px solid #e8e0d5; font-weight: 500;">¥${formatCurrency(amount)}</td>
      <td style="padding: 8px 12px; text-align: right; border: 1px solid #e8e0d5; color: #666;">${catBudget > 0 ? '¥' + formatCurrency(catBudget) : '—'}</td>
      <td style="padding: 8px 12px; text-align: right; border: 1px solid #e8e0d5; color: ${over ? '#d32f2f' : '#333'}; font-weight: ${over ? '600' : '400'};">${catBudget > 0 ? usage.toFixed(1) + '%' : '—'}</td>
      <td style="padding: 8px 12px; text-align: right; border: 1px solid #e8e0d5; color: #8B5A2B;">${percent.toFixed(1)}%</td>
    </tr>`;
  });
  html += `</tbody></table>`;

  // 装修进度
  html += `<h2 style="font-size: 18px; font-weight: 600; color: #8B5A2B; margin: 24px 0 16px; padding-left: 10px; border-left: 4px solid #8B5A2B;">三、装修进度总览</h2>`;
  html += `<div style="background: #faf6f0; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
    <div style="font-size: 13px; color: #666; margin-bottom: 8px;">整体完成度</div>
    <div style="font-size: 28px; font-weight: 700; color: #8B5A2B;">${overallTodoProgress.toFixed(1)}%</div>
  </div>`;
  html += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">`;
  todoCategories.forEach((cat) => {
    const done = cat.items.filter((i) => i.status === 'done').length;
    const total = cat.items.filter((i) => i.status !== 'not_applicable').length;
    const pct = total > 0 ? (done / total) * 100 : 0;
    html += `<div style="padding: 10px 12px; border: 1px solid #e8e0d5; border-radius: 6px;">
      <div style="font-size: 13px; font-weight: 500; margin-bottom: 4px;">${cat.icon} ${cat.name}</div>
      <div style="font-size: 12px; color: #666;">${done}/${total}（${pct.toFixed(0)}%）</div>
      <div style="height: 4px; background: #eee; border-radius: 2px; margin-top: 6px; overflow: hidden;">
        <div style="height: 100%; width: ${pct}%; background: #8B5A2B; border-radius: 2px;"></div>
      </div>
    </div>`;
  });
  html += `</div>`;

  // 费用明细
  html += `<h2 style="font-size: 18px; font-weight: 600; color: #8B5A2B; margin: 24px 0 16px; padding-left: 10px; border-left: 4px solid #8B5A2B;">四、费用明细列表</h2>`;
  if (records.length > 0) {
    html += `<table style="width: 100%; border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr style="background: #f5efe6;">
          <th style="padding: 8px 10px; text-align: left; border: 1px solid #e0d5c5;">日期</th>
          <th style="padding: 8px 10px; text-align: left; border: 1px solid #e0d5c5;">类别</th>
          <th style="padding: 8px 10px; text-align: left; border: 1px solid #e0d5c5;">项目</th>
          <th style="padding: 8px 10px; text-align: left; border: 1px solid #e0d5c5;">商家</th>
          <th style="padding: 8px 10px; text-align: right; border: 1px solid #e0d5c5;">金额</th>
          <th style="padding: 8px 10px; text-align: left; border: 1px solid #e0d5c5;">支付方式</th>
        </tr>
      </thead><tbody>`;
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    sorted.forEach((r) => {
      html += `<tr>
        <td style="padding: 6px 10px; border: 1px solid #e8e0d5;">${r.date}</td>
        <td style="padding: 6px 10px; border: 1px solid #e8e0d5;">${CATEGORY_LABELS[r.category]}</td>
        <td style="padding: 6px 10px; border: 1px solid #e8e0d5;">${r.subCategory}</td>
        <td style="padding: 6px 10px; border: 1px solid #e8e0d5; color: #666;">${r.merchant || '—'}</td>
        <td style="padding: 6px 10px; text-align: right; border: 1px solid #e8e0d5; font-weight: 500;">¥${formatCurrency(r.amount)}</td>
        <td style="padding: 6px 10px; border: 1px solid #e8e0d5; color: #666;">${PAYMENT_LABELS[r.paymentMethod]}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
  } else {
    html += `<p style="color: #999; text-align: center; padding: 20px;">暂无费用记录</p>`;
  }

  html += `<div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #e0d5c5; text-align: center; font-size: 11px; color: #aaa;">
    本报告由装修费用管家（维佳关山郡）自动生成 · ${new Date().toLocaleString('zh-CN')}
  </div>`;

  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
}

export async function generateExpensePDF(params: PDFExportParams): Promise<void> {
  const container = buildPDFContent(params);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`装修费用报告_维佳关山郡_${new Date().toISOString().slice(0, 10)}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
