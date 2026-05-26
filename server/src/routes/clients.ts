import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'
import { refreshClientWorkOrderStatuses } from '../lib/balance'

const router = Router()
router.use(authenticate)

router.get('/', async (req: AuthRequest, res: Response) => {
  const { topicId } = req.query

  if (topicId) {
    // collect client IDs from both sources separately — no OR to avoid JOIN duplicates
    const [fromTopics, fromPayments] = await Promise.all([
      prisma.clientTopic.findMany({ where: { topicId: topicId as string }, select: { clientId: true } }),
      prisma.payment.findMany({ where: { topicId: topicId as string, userId: req.userId }, select: { clientId: true }, distinct: ['clientId'] })
    ])
    const clientIds = [...new Set([...fromTopics.map(r => r.clientId), ...fromPayments.map(r => r.clientId)])]

    const clients = await prisma.client.findMany({
      where: { userId: req.userId, id: { in: clientIds } },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { payments: true } },
        payments: {
          where: { topicId: topicId as string },
          include: { transactions: true }
        },
        clientPayments: { orderBy: { date: 'desc' } }
      }
    })
    res.json(clients)
    return
  }

  const clients = await prisma.client.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { payments: true } },
      clientPayments: { select: { id: true, amount: true, date: true, notes: true }, orderBy: { date: 'desc' } }
    }
  })
  const clientIds = clients.map(c => c.id)
  const [woTotals, cpTotals] = await Promise.all([
    prisma.payment.groupBy({ by: ['clientId'], where: { clientId: { in: clientIds } }, _sum: { totalAmount: true } }),
    prisma.clientPayment.groupBy({ by: ['clientId'], where: { clientId: { in: clientIds } }, _sum: { amount: true } })
  ])
  const withBalance = clients.map(c => {
    const totalOwed = Number(woTotals.find(r => r.clientId === c.id)?._sum.totalAmount ?? 0)
    const totalPaid = Number(cpTotals.find(r => r.clientId === c.id)?._sum.amount ?? 0)
    return { ...c, totalOwed, totalPaid, balance: totalOwed - totalPaid }
  })
  res.json(withBalance)
})

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: {
      payments: { include: { topic: true }, orderBy: { createdAt: 'desc' } },
      clientPayments: { orderBy: { date: 'desc' } }
    }
  })
  if (!client) { res.status(404).json({ error: 'Not found' }); return }

  const sortedWorkOrders = [...client.payments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
  const totalOwed = sortedWorkOrders.reduce((s, p) => s + Number(p.totalAmount), 0)
  const totalPaid = client.clientPayments.reduce((s, p) => s + Number(p.amount), 0)
  const balance = totalOwed - totalPaid

  // FIFO coverage per work order
  let remaining = totalPaid
  const workOrders = sortedWorkOrders.map(p => {
    const amount = Number(p.totalAmount)
    const coveredAmount = Math.min(remaining, amount)
    remaining = Math.max(0, remaining - amount)
    return { ...p, coveredAmount }
  })

  res.json({ ...client, workOrders, totalOwed, totalPaid, balance })
})

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, contactEmail, phone, notes, topicId } = req.body
  if (!name) {
    res.status(400).json({ error: 'Name is required' })
    return
  }
  const client = await prisma.client.create({
    data: { userId: req.userId!, name, contactEmail, phone, notes }
  })
  if (topicId) {
    await prisma.clientTopic.create({ data: { clientId: client.id, topicId } })
  }
  res.status(201).json(client)
})

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.client.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const { name, contactEmail, phone, notes } = req.body
  const client = await prisma.client.update({
    where: { id: req.params.id },
    data: { name, contactEmail, phone, notes }
  })
  res.json(client)
})

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.client.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  await prisma.client.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

export default router
