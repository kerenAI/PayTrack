import { Router, Response } from 'express'
import { Prisma } from '@prisma/client'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', async (req: AuthRequest, res: Response) => {
  const { supplierId } = req.query
  const payments = await prisma.supplierPayment.findMany({
    where: { userId: req.userId, ...(supplierId ? { supplierId: supplierId as string } : {}) },
    orderBy: { date: 'desc' }
  })
  res.json(payments)
})

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { supplierId, amount, date, notes } = req.body
  if (!supplierId || !amount || !date) { res.status(400).json({ error: 'supplierId, amount and date are required' }); return }
  const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, userId: req.userId } })
  if (!supplier) { res.status(404).json({ error: 'Supplier not found' }); return }
  const payment = await prisma.supplierPayment.create({
    data: { supplierId, userId: req.userId!, amount: new Prisma.Decimal(amount), date: new Date(date), notes }
  })
  res.status(201).json(payment)
})

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.supplierPayment.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) { res.status(404).json({ error: 'Not found' }); return }
  const { amount, date, notes } = req.body
  const payment = await prisma.supplierPayment.update({
    where: { id: req.params.id },
    data: {
      ...(amount !== undefined && { amount: new Prisma.Decimal(amount) }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(notes !== undefined && { notes })
    }
  })
  res.json(payment)
})

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.supplierPayment.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) { res.status(404).json({ error: 'Not found' }); return }
  await prisma.supplierPayment.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

export default router
