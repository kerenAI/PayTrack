import { Router, Response } from 'express'
import { Prisma } from '@prisma/client'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [allExpenses, suppliersRaw] = await Promise.all([
    prisma.expense.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.supplier.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        expenses: { select: { amount: true } },
        supplierPayments: { select: { amount: true } }
      }
    })
  ])

  const totalAllTime = allExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const thisMonthExpenses = allExpenses.filter(e => new Date(e.date) >= startOfMonth)
  const totalThisMonth = thisMonthExpenses.reduce((s, e) => s + Number(e.amount), 0)

  // Monthly chart — last 6 months
  const monthlyMap: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap[key] = 0
  }
  allExpenses.forEach(e => {
    const d = new Date(e.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (key in monthlyMap) monthlyMap[key] += Number(e.amount)
  })
  const monthlyChart = Object.entries(monthlyMap).map(([month, total]) => ({ month, total }))

  // Recent suppliers with balance
  const recentSuppliers = suppliersRaw
    .map(s => {
      const totalInvoiced = s.expenses.reduce((sum, e) => sum + Number(e.amount), 0)
      const totalPaid = s.supplierPayments.reduce((sum, p) => sum + Number(p.amount), 0)
      return { supplierId: s.id, name: s.name, totalInvoiced, totalPaid, balance: totalInvoiced - totalPaid }
    })
    .filter(s => s.totalInvoiced > 0 || s.totalPaid > 0)

  res.json({ totalAllTime, totalThisMonth, countThisMonth: thisMonthExpenses.length, monthlyChart, recentSuppliers })
})

router.get('/', async (req: AuthRequest, res: Response) => {
  const { categoryId, supplierId, from, to } = req.query
  const expenses = await prisma.expense.findMany({
    where: {
      userId: req.userId,
      ...(categoryId ? { categoryId: categoryId as string } : {}),
      ...(supplierId ? { supplierId: supplierId as string } : {}),
      ...((from || to) ? { date: {
        ...(from ? { gte: new Date(from as string) } : {}),
        ...(to ? { lte: new Date((to as string) + 'T23:59:59') } : {})
      }} : {})
    },
    orderBy: { date: 'desc' },
    include: { supplier: true, category: true }
  })
  res.json(expenses)
})

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { amount, date, description, notes, supplierId, categoryId } = req.body
  if (!amount || !date) { res.status(400).json({ error: 'amount and date are required' }); return }
  const expense = await prisma.expense.create({
    data: {
      userId: req.userId!,
      amount: new Prisma.Decimal(amount),
      date: new Date(date),
      description,
      notes,
      supplierId: supplierId || null,
      categoryId: categoryId || null
    },
    include: { supplier: true, category: true }
  })
  res.status(201).json(expense)
})

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.expense.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) { res.status(404).json({ error: 'Not found' }); return }
  const { amount, date, description, notes, supplierId, categoryId } = req.body
  const expense = await prisma.expense.update({
    where: { id: req.params.id },
    data: {
      ...(amount !== undefined && { amount: new Prisma.Decimal(amount) }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(description !== undefined && { description }),
      ...(notes !== undefined && { notes }),
      supplierId: supplierId || null,
      categoryId: categoryId || null
    },
    include: { supplier: true, category: true }
  })
  res.json(expense)
})

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.expense.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) { res.status(404).json({ error: 'Not found' }); return }
  await prisma.expense.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

export default router
