import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [totalIncome, pendingCount, overdueCount, recentPayments, monthlyTotals] = await Promise.all([
    prisma.paymentTransaction.aggregate({
      where: { userId, type: { in: ['PAYMENT', 'PREPAYMENT_APPLY'] } },
      _sum: { amount: true }
    }),
    prisma.payment.count({ where: { userId, status: 'PENDING' } }),
    prisma.payment.count({ where: { userId, status: 'OVERDUE' } }),
    prisma.payment.findMany({
      where: { userId },
      include: { client: true, topic: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    }),
    prisma.paymentTransaction.findMany({
      where: {
        userId,
        type: { in: ['PAYMENT', 'PREPAYMENT_APPLY'] },
        date: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }
      },
      select: { amount: true, date: true }
    })
  ])

  // Group monthly totals
  const monthMap: Record<string, number> = {}
  for (const tx of monthlyTotals) {
    const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`
    monthMap[key] = (monthMap[key] ?? 0) + Number(tx.amount)
  }

  // Open prepayments
  const [prepaidTotal, prepaidApplied] = await Promise.all([
    prisma.paymentTransaction.aggregate({ where: { userId, type: 'PREPAYMENT' }, _sum: { amount: true } }),
    prisma.paymentTransaction.aggregate({ where: { userId, type: 'PREPAYMENT_APPLY' }, _sum: { amount: true } })
  ])
  const openPrepayments = Number(prepaidTotal._sum.amount ?? 0) - Number(prepaidApplied._sum.amount ?? 0)

  // This month income
  const thisMonthTx = await prisma.paymentTransaction.aggregate({
    where: {
      userId,
      type: { in: ['PAYMENT', 'PREPAYMENT_APPLY'] },
      date: { gte: startOfMonth, lte: endOfMonth }
    },
    _sum: { amount: true }
  })

  res.json({
    totalIncome: Number(totalIncome._sum.amount ?? 0),
    thisMonthIncome: Number(thisMonthTx._sum.amount ?? 0),
    pendingCount,
    overdueCount,
    openPrepayments,
    recentPayments,
    monthlyChart: Object.entries(monthMap).map(([month, total]) => ({ month, total })).sort((a, b) => a.month.localeCompare(b.month))
  })
})

export default router
