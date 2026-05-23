import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', async (req: AuthRequest, res: Response) => {
  const { topicId } = req.query

  if (topicId) {
    const clients = await prisma.client.findMany({
      where: {
        userId: req.userId,
        OR: [
          { clientTopics: { some: { topicId: topicId as string } } },
          { payments: { some: { topicId: topicId as string } } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { payments: true } },
        payments: {
          where: { topicId: topicId as string },
          include: { transactions: true }
        }
      }
    })
    res.json(clients)
    return
  }

  const clients = await prisma.client.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { payments: true } } }
  })
  res.json(clients)
})

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: {
      payments: {
        include: { topic: true, transactions: true },
        orderBy: { createdAt: 'desc' }
      }
    }
  })
  if (!client) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  const prepaidTotal = await prisma.paymentTransaction.aggregate({
    where: { clientId: req.params.id, type: 'PREPAYMENT' },
    _sum: { amount: true }
  })
  const prepaidApplied = await prisma.paymentTransaction.aggregate({
    where: { clientId: req.params.id, type: 'PREPAYMENT_APPLY' },
    _sum: { amount: true }
  })

  const prepaymentBalance =
    Number(prepaidTotal._sum.amount ?? 0) - Number(prepaidApplied._sum.amount ?? 0)

  res.json({ ...client, prepaymentBalance })
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
