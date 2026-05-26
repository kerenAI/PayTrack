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

  const [totalIncome, pendingCount, overdueCount, monthlyTotals, woClientIds, cpClientIds] = await Promise.all([
    prisma.paymentTransaction.aggregate({
      where: { userId, type: { in: ['PAYMENT', 'PREPAYMENT_APPLY'] } },
      _sum: { amount: true }
    }),
    prisma.payment.count({ where: { userId, status: 'PENDING' } }),
    prisma.payment.count({ where: { userId, status: 'OVERDUE' } }),
    prisma.paymentTransaction.findMany({
      where: {
        userId,
        type: { in: ['PAYMENT', 'PREPAYMENT_APPLY'] },
        date: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }
      },
      select: { amount: true, date: true }
    }),
    // get client IDs that have work orders — no OR, no JOIN duplicates
    prisma.payment.findMany({ where: { userId }, select: { clientId: true }, distinct: ['clientId'] }),
    prisma.clientPayment.findMany({ where: { userId }, select: { clientId: true }, distinct: ['clientId'] })
  ])

  // union of client IDs that have any activity
  const activeIds = [...new Set([...woClientIds.map(r => r.clientId), ...cpClientIds.map(r => r.clientId)])]

  // fetch the 8 most recently created active clients — plain findMany, no OR
  const recentClientRows = await prisma.client.findMany({
    where: { userId, id: { in: activeIds } },
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: { id: true, name: true }
  })

  // initialise all 6 months with 0 so every month appears on the X axis
  const monthMap: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthMap[key] = 0
  }
  for (const tx of monthlyTotals) {
    const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`
    if (key in monthMap) monthMap[key] += Number(tx.amount)
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

  // aggregate totals per client using groupBy — one row per client, no duplicates
  const clientIds = recentClientRows.map(c => c.id)
  const [woTotals, cpTotals] = await Promise.all([
    prisma.payment.groupBy({
      by: ['clientId'],
      where: { clientId: { in: clientIds } },
      _sum: { totalAmount: true }
    }),
    prisma.clientPayment.groupBy({
      by: ['clientId'],
      where: { clientId: { in: clientIds } },
      _sum: { amount: true }
    })
  ])
  const recentClientsWithBalance = recentClientRows.map(c => {
    const totalOwed = Number(woTotals.find(r => r.clientId === c.id)?._sum.totalAmount ?? 0)
    const totalPaid = Number(cpTotals.find(r => r.clientId === c.id)?._sum.amount ?? 0)
    return { id: c.id, name: c.name, totalOwed, totalPaid, balance: totalOwed - totalPaid }
  })

  res.json({
    totalIncome: Number(totalIncome._sum.amount ?? 0),
    thisMonthIncome: Number(thisMonthTx._sum.amount ?? 0),
    pendingCount,
    overdueCount,
    openPrepayments,
    recentClients: recentClientsWithBalance,
    monthlyChart: Object.entries(monthMap).map(([month, total]) => ({ month, total })).sort((a, b) => a.month.localeCompare(b.month))
  })
})

export default router
