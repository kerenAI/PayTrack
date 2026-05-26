import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', async (req: AuthRequest, res: Response) => {
  const suppliers = await prisma.supplier.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { expenses: true } },
      expenses: { select: { id: true, amount: true, date: true, description: true, notes: true, categoryId: true }, orderBy: { date: 'desc' } },
      supplierPayments: { select: { id: true, amount: true, date: true, notes: true }, orderBy: { date: 'desc' } }
    }
  })
  const result = suppliers.map(s => {
    const totalInvoiced = s.expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const totalPaid = s.supplierPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    return { ...s, totalInvoiced, totalPaid, balance: totalInvoiced - totalPaid }
  })
  res.json(result)
})

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, contactEmail, phone, notes, categoryId } = req.body
  if (!name) { res.status(400).json({ error: 'Name is required' }); return }
  const supplier = await prisma.supplier.create({
    data: { userId: req.userId!, name, contactEmail, phone, notes, categoryId: categoryId || null }
  })
  res.status(201).json(supplier)
})

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.supplier.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) { res.status(404).json({ error: 'Not found' }); return }
  const { name, contactEmail, phone, notes, categoryId } = req.body
  const supplier = await prisma.supplier.update({
    where: { id: req.params.id },
    data: { name, contactEmail, phone, notes, categoryId: categoryId !== undefined ? (categoryId || null) : existing.categoryId }
  })
  res.json(supplier)
})

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.supplier.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) { res.status(404).json({ error: 'Not found' }); return }
  await prisma.supplier.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

export default router
