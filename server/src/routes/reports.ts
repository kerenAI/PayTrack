import { Router, Response } from 'express'
import { Prisma } from '@prisma/client'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', async (req: AuthRequest, res: Response) => {
  const { from, to, topicId, clientId, status } = req.query
  const userId = req.userId!

  const where: Prisma.PaymentWhereInput = { userId }
  if (topicId) where.topicId = topicId as string
  if (clientId) where.clientId = clientId as string
  if (status) where.status = status as any
  if (from || to) {
    where.createdAt = {
      ...(from && { gte: new Date(from as string) }),
      ...(to && { lte: new Date(to as string) })
    }
  }

  const payments = await prisma.payment.findMany({
    where,
    include: { client: true, topic: true, transactions: true },
    orderBy: { createdAt: 'desc' }
  })
  res.json(payments)
})

router.get('/csv', async (req: AuthRequest, res: Response) => {
  const { from, to, topicId, clientId } = req.query
  const userId = req.userId!

  const where: Prisma.PaymentWhereInput = { userId }
  if (topicId) where.topicId = topicId as string
  if (clientId) where.clientId = clientId as string
  if (from || to) {
    where.createdAt = {
      ...(from && { gte: new Date(from as string) }),
      ...(to && { lte: new Date(to as string) })
    }
  }

  const payments = await prisma.payment.findMany({
    where,
    include: { client: true, topic: true, transactions: true },
    orderBy: { createdAt: 'desc' }
  })

  const rows = [
    ['ID', 'Client', 'Topic', 'Total Amount', 'Paid', 'Remaining', 'Status', 'Due Date', 'Description', 'Created At'],
    ...payments.map(p => {
      const paid = p.transactions
        .filter(t => t.type === 'PAYMENT' || t.type === 'PREPAYMENT_APPLY')
        .reduce((s, t) => s + Number(t.amount), 0)
      return [
        p.id,
        p.client.name,
        p.topic.name,
        Number(p.totalAmount),
        paid,
        Number(p.totalAmount) - paid,
        p.status,
        p.dueDate ? p.dueDate.toISOString().slice(0, 10) : '',
        p.description ?? '',
        p.createdAt.toISOString().slice(0, 10)
      ]
    })
  ]

  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="paytrack-report.csv"')
  res.send(csv)
})

export default router
