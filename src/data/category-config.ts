import type { ExpenseCategory, PaymentMethod } from './input-number';

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  design: '设计费',
  hardware: '硬装',
  main_material: '主材',
  soft_furnishing: '软装',
  appliance: '家电',
  labor: '人工费用',
  other: '其他杂费',
};

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  design: '🎨',
  hardware: '🔧',
  main_material: '🧱',
  soft_furnishing: '🛋️',
  appliance: '📺',
  labor: '👷',
  other: '📦',
};

export const SUBCATEGORY_SUGGESTIONS: Record<ExpenseCategory, string[]> = {
  design: ['设计费', '效果图费', '监理费'],
  hardware: ['水电改造', '泥瓦工程', '木工', '油漆涂料', '防水工程', '拆改', '吊顶'],
  main_material: ['地板', '瓷砖', '门窗', '橱柜', '卫浴', '吊顶材料', '墙纸/壁布'],
  soft_furnishing: ['家具', '窗帘', '灯具', '装饰画', '地毯', '床品', '摆件'],
  appliance: ['冰箱', '洗衣机', '空调', '电视', '厨房电器', '热水器', '净化器'],
  labor: ['水电工', '瓦工', '木工', '油漆工', '搬运费', '安装费'],
  other: ['物业费', '垃圾清运费', '材料运输费', '测量费', '其他'],
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: '现金',
  wechat: '微信',
  alipay: '支付宝',
  bank_card: '银行卡',
  other: '其他',
};

export const CHART_COLORS = [
  '#8B5A2B',
  '#C9A87C',
  '#5D8A72',
  '#8BA4B0',
  '#B08C7A',
  '#D4A574',
  '#96A88C',
];
