import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', async (req: AuthRequest, res: Response) => {
  const topics = await prisma.topic.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { payments: true } }
    }
  })
  res.json(topics)
})

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description, color } = req.body
  if (!name) {
    res.status(400).json({ error: 'Name is required' })
    return
  }
  const topic = await prisma.topic.create({
    data: { userId: req.userId!, name, description, color }
  })
  res.status(201).json(topic)
})

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description, color } = req.body
  const topic = await prisma.topic.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!topic) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const updated = await prisma.topic.update({
    where: { id: req.params.id },
    data: { name, description, color }
  })
  res.json(updated)
})

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const topic = await prisma.topic.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!topic) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  await prisma.topic.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

export default router
