import { Router, Response } from 'express'
import { Prisma, PaymentStatus } from '@prisma/client'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'
import { refreshClientWorkOrderStatuses } from '../lib/balance'

const router = Router()
router.use(authenticate)

function computeStatus(totalAmount: number, paidSoFar: number, dueDate: Date | null): PaymentStatus {
  const remaining = totalAmount - paidSoFar
  if (remaining <= 0) return 'PAID'
  if (paidSoFar > 0 && paidSoFar < totalAmount) return 'PARTIAL'
  if (dueDate && new Date() > dueDate && remaining > 0) return 'OVERDUE'
  return 'PENDING'
}

async function refreshPaymentStatus(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { transactions: true }
  })
  if (!payment) return

  const paidSoFar = payment.transactions
    .filter(t => t.type === 'PAYMENT' || t.type === 'PREPAYMENT_APPLY')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const hasCreditOnly = payment.transactions.some(t => t.type === 'CREDIT')
  const status = hasCreditOnly && paidSoFar === 0
    ? 'CREDITED'
    : computeStatus(Number(payment.totalAmount), paidSoFar, payment.dueDate)

  await prisma.payment.update({ where: { id: paymentId }, data: { status } })
}

router.get('/', async (req: AuthRequest, res: Response) => {
  const { clientId, topicId, status } = req.query
  const where: Prisma.PaymentWhereInput = { userId: req.userId }
  if (clientId) where.clientId = clientId as string
  if (topicId) where.topicId = topicId as string
  if (status) where.status = status as PaymentStatus

  const payments = await prisma.payment.findMany({
    where,
    include: { client: true, topic: true, transactions: true },
    orderBy: { createdAt: 'desc' }
  })
  res.json(payments)
})

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const payment = await prisma.payment.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { client: true, topic: true, transactions: { orderBy: { date: 'desc' } } }
  })
  if (!payment) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json(payment)
})

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { clientId, topicId, totalAmount, dueDate, description, isRecurring } = req.body
  if (!clientId || !topicId || !totalAmount) {
    res.status(400).json({ error: 'clientId, topicId and totalAmount are required' })
    return
  }

  const client = await prisma.client.findFirst({ where: { id: clientId, userId: req.userId } })
  const topic = await prisma.topic.findFirst({ where: { id: topicId, userId: req.userId } })
  if (!client || !topic) {
    res.status(404).json({ error: 'Client or topic not found' })
    return
  }

  const payment = await prisma.payment.create({
    data: {
      clientId,
      topicId,
      userId: req.userId!,
      totalAmount: new Prisma.Decimal(totalAmount),
      dueDate: dueDate ? new Date(dueDate) : null,
      description,
      isRecurring: isRecurring ?? false
    },
    include: { client: true, topic: true, transactions: true }
  })
  await refreshClientWorkOrderStatuses(clientId)
  res.status(201).json(payment)
})

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.payment.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const { totalAmount, dueDate, description, isRecurring, topicId } = req.body
  await prisma.payment.update({
    where: { id: req.params.id },
    data: {
      ...(totalAmount !== undefined && { totalAmount: new Prisma.Decimal(totalAmount) }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(description !== undefined && { description }),
      ...(isRecurring !== undefined && { isRecurring }),
      ...(topicId !== undefined && { topicId })
    }
  })
  await refreshPaymentStatus(req.params.id)
  const updated = await prisma.payment.findUnique({
    where: { id: req.params.id },
    include: { client: true, topic: true, transactions: true }
  })
  res.json(updated)
})

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.payment.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  await prisma.payment.delete({ where: { id: req.params.id } })
  await refreshClientWorkOrderStatuses(existing.clientId)
  res.json({ ok: true })
})

// Transactions
router.post('/:id/transactions', async (req: AuthRequest, res: Response): Promise<void> => {
  const payment = await prisma.payment.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!payment) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const { amount, type, date, notes } = req.body
  if (!amount || !type || !date) {
    res.status(400).json({ error: 'amount, type and date are required' })
    return
  }

  const transaction = await prisma.paymentTransaction.create({
    data: {
      paymentId: req.params.id,
      clientId: payment.clientId,
      userId: req.userId!,
      amount: new Prisma.Decimal(amount),
      type,
      date: new Date(date),
      notes
    }
  })

  await refreshPaymentStatus(req.params.id)
  res.status(201).json(transaction)
})

router.delete('/:id/transactions/:txId', async (req: AuthRequest, res: Response): Promise<void> => {
  const payment = await prisma.payment.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!payment) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  await prisma.paymentTransaction.delete({ where: { id: req.params.txId } })
  await refreshPaymentStatus(req.params.id)
  res.json({ ok: true })
})

export default router
