import { Router, Response } from 'express'
import { Prisma } from '@prisma/client'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

// Add a general prepayment for a client (not linked to a specific payment)
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { clientId, amount, date, notes } = req.body
  if (!clientId || !amount || !date) {
    res.status(400).json({ error: 'clientId, amount and date are required' })
    return
  }

  const client = await prisma.client.findFirst({ where: { id: clientId, userId: req.userId } })
  if (!client) {
    res.status(404).json({ error: 'Client not found' })
    return
  }

  const transaction = await prisma.paymentTransaction.create({
    data: {
      paymentId: null,
      clientId,
      userId: req.userId!,
      amount: new Prisma.Decimal(amount),
      type: 'PREPAYMENT',
      date: new Date(date),
      notes
    }
  })
  res.status(201).json(transaction)
})

// Get prepayment balance for a client
router.get('/balance/:clientId', async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await prisma.client.findFirst({ where: { id: req.params.clientId, userId: req.userId } })
  if (!client) {
    res.status(404).json({ error: 'Client not found' })
    return
  }

  const [prepaid, applied] = await Promise.all([
    prisma.paymentTransaction.aggregate({
      where: { clientId: req.params.clientId, type: 'PREPAYMENT' },
      _sum: { amount: true }
    }),
    prisma.paymentTransaction.aggregate({
      where: { clientId: req.params.clientId, type: 'PREPAYMENT_APPLY' },
      _sum: { amount: true }
    })
  ])

  const balance = Number(prepaid._sum.amount ?? 0) - Number(applied._sum.amount ?? 0)
  res.json({ clientId: req.params.clientId, balance })
})

export default router
