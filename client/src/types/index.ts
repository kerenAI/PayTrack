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

export interface DashboardData {
  totalIncome: number
  thisMonthIncome: number
  pendingCount: number
  overdueCount: number
  openPrepayments: number
  recentPayments: Payment[]
  monthlyChart: { month: string; total: number }[]
}
