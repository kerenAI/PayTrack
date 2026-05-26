import { Router, Response } from 'express'
import { Prisma } from '@prisma/client'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'
import { refreshClientWorkOrderStatuses } from '../lib/balance'

const router = Router()
router.use(authenticate)

router.get('/', async (req: AuthRequest, res: Response) => {
  const { clientId } = req.query
  const payments = await prisma.clientPayment.findMany({
    where: { userId: req.userId, ...(clientId ? { clientId: clientId as string } : {}) },
    orderBy: { date: 'desc' },
    include: { client: true }
  })
  res.json(payments)
})

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { clientId, amount, date, notes } = req.body
  if (!clientId || !amount || !date) {
    res.status(400).json({ error: 'clientId, amount and date are required' })
    return
  }
  const client = await prisma.client.findFirst({ where: { id: clientId, userId: req.userId } })
  if (!client) { res.status(404).json({ error: 'Client not found' }); return }

  const payment = await prisma.clientPayment.create({
    data: { clientId, userId: req.userId!, amount: new Prisma.Decimal(amount), date: new Date(date), notes }
  })
  await refreshClientWorkOrderStatuses(clientId)
  res.status(201).json(payment)
})

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.clientPayment.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) { res.status(404).json({ error: 'Not found' }); return }

  const { amount, date, notes } = req.body
  const updated = await prisma.clientPayment.update({
    where: { id: req.params.id },
    data: {
      ...(amount !== undefined && { amount: new Prisma.Decimal(amount) }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(notes !== undefined && { notes })
    }
  })
  await refreshClientWorkOrderStatuses(existing.clientId)
  res.json(updated)
})

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.clientPayment.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) { res.status(404).json({ error: 'Not found' }); return }

  await prisma.clientPayment.delete({ where: { id: req.params.id } })
  await refreshClientWorkOrderStatuses(existing.clientId)
  res.json({ ok: true })
})

export default router
