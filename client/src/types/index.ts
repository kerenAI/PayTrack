export interface User {
  id: string
  name: string
  email: string
}

export interface Topic {
  id: string
  userId: string
  name: string
  description?: string
  color: string
  createdAt: string
  _count?: { payments: number }
}

export interface Client {
  id: string
  userId: string
  name: string
  contactEmail?: string
  phone?: string
  notes?: string
  createdAt: string
  _count?: { payments: number }
  prepaymentBalance?: number
}

export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PREPAID' | 'PAID' | 'OVERDUE' | 'CREDITED'
export type TransactionType = 'PAYMENT' | 'CREDIT' | 'PREPAYMENT' | 'PREPAYMENT_APPLY'

export interface PaymentTransaction {
  id: string
  paymentId: string | null
  clientId: string
  amount: string
  type: TransactionType
  date: string
  notes?: string
  createdAt: string
}

export interface Payment {
  id: string
  clientId: string
  topicId: string
  userId: string
  totalAmount: string
  dueDate?: string
  description?: string
  isRecurring: boolean
  status: PaymentStatus
  createdAt: string
  client?: Client
  topic?: Topic
  transactions?: PaymentTransaction[]
}

export interface ClientPayment {
  id: string
  clientId: string
  userId: string
  amount: string
  date: string
  notes?: string
  createdAt: string
}

export interface WorkOrder extends Payment {
  coveredAmount: number
}

export interface ClientWithBalance extends Client {
  workOrders: WorkOrder[]
  clientPayments: ClientPayment[]
  totalOwed: number
  totalPaid: number
  balance: number
}

export interface SupplierPayment {
  id: string
  supplierId: string
  userId: string
  amount: string
  date: string
  notes?: string
  createdAt: string
}

export interface Supplier {
  id: string
  userId: string
  categoryId?: string | null
  name: string
  contactEmail?: string
  phone?: string
  notes?: string
  createdAt: string
  _count?: { expenses: number }
}

export interface SupplierWithBalance extends Supplier {
  expenses: Expense[]
  supplierPayments: SupplierPayment[]
  totalInvoiced: number
  totalPaid: number
  balance: number
}

export interface ExpenseCategoryWithSuppliers extends ExpenseCategory {
  suppliers: SupplierWithBalance[]
}

export interface ExpenseCategory {
  id: string
  userId: string
  name: string
  color: string
  createdAt: string
  _count?: { expenses: number }
}

export interface Expense {
  id: string
  userId: string
  supplierId?: string | null
  categoryId?: string | null
  amount: string
  date: string
  description?: string
  notes?: string
  createdAt: string
  supplier?: Supplier
  category?: ExpenseCategory
}

export interface SupplierBalanceSummary {
  supplierId: string
  name: string
  totalInvoiced: number
  totalPaid: number
  balance: number
}

export interface ExpenseDashboard {
  totalAllTime: number
  totalThisMonth: number
  countThisMonth: number
  monthlyChart: { month: string; total: number }[]
  recentSuppliers: SupplierBalanceSummary[]
}

export interface ClientBalanceSummary {
  id: string
  name: string
  totalOwed: number
  totalPaid: number
  balance: number
}

export interface DashboardData {
  totalIncome: number
  thisMonthIncome: number
  pendingCount: number
  overdueCount: number
  openPrepayments: number
  recentClients: ClientBalanceSummary[]
  monthlyChart: { month: string; total: number }[]
}
