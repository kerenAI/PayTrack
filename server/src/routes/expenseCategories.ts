import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', async (req: AuthRequest, res: Response) => {
  const categories = await prisma.expenseCategory.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { expenses: true, suppliers: true } } }
  })
  res.json(categories)
})

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const category = await prisma.expenseCategory.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: {
      suppliers: {
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          expenses: { orderBy: { date: 'desc' } },
          supplierPayments: { orderBy: { date: 'desc' } }
        }
      }
    }
  })
  if (!category) { res.status(404).json({ error: 'Not found' }); return }

  const result = {
    ...category,
    suppliers: category.suppliers.map(s => {
      const totalInvoiced = s.expenses.reduce((sum, e) => sum + Number(e.amount), 0)
      const totalPaid = s.supplierPayments.reduce((sum, p) => sum + Number(p.amount), 0)
      return { ...s, totalInvoiced, totalPaid, balance: totalInvoiced - totalPaid }
    })
  }
  res.json(result)
})

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, color } = req.body
  if (!name) { res.status(400).json({ error: 'Name is required' }); return }
  const category = await prisma.expenseCategory.create({
    data: { userId: req.userId!, name, color: color ?? '#f59e0b' }
  })
  res.status(201).json(category)
})

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.expenseCategory.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) { res.status(404).json({ error: 'Not found' }); return }
  const { name, color } = req.body
  const category = await prisma.expenseCategory.update({
    where: { id: req.params.id },
    data: { name, color }
  })
  res.json(category)
})

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.expenseCategory.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) { res.status(404).json({ error: 'Not found' }); return }
  await prisma.expenseCategory.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

export default router
