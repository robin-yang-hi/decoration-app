export type ExpenseCategory =
  | 'design'
  | 'hardware'
  | 'main_material'
  | 'soft_furnishing'
  | 'appliance'
  | 'labor'
  | 'other'

export type PaymentMethod = 'cash' | 'wechat' | 'alipay' | 'bank_card' | 'other'

export interface IExpenseRecord {
  id: string
  date: string
  category: ExpenseCategory
  subCategory: string
  amount: number
  paymentMethod: PaymentMethod
  merchant: string
  remark: string
  createdAt: number
  source: 'mock' | 'user'
}

export const MOCK_EXPENSE_RECORDS: IExpenseRecord[] = [
  {
    id: '1',
    date: '2024-01-15',
    category: 'design',
    subCategory: '设计费',
    amount: 8000,
    paymentMethod: 'alipay',
    merchant: 'XX设计工作室',
    remark: '全屋设计方案',
    createdAt: 1705276800000,
    source: 'mock',
  },
  {
    id: '2',
    date: '2024-02-20',
    category: 'main_material',
    subCategory: '瓷砖',
    amount: 12500,
    paymentMethod: 'bank_card',
    merchant: '东鹏瓷砖',
    remark: '客厅+厨卫瓷砖',
    createdAt: 1708387200000,
    source: 'mock',
  },
  {
    id: '3',
    date: '2024-03-10',
    category: 'soft_furnishing',
    subCategory: '家具',
    amount: 25000,
    paymentMethod: 'wechat',
    merchant: '宜家家居',
    remark: '沙发+餐桌+床',
    createdAt: 1710028800000,
    source: 'mock',
  },
]
