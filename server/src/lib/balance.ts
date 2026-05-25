import { PaymentStatus } from '@prisma/client'
import prisma from './prisma'

export async function refreshClientWorkOrderStatuses(clientId: string) {
  const [workOrders, clientPayments] = await Promise.all([
    prisma.payment.findMany({ where: { clientId }, orderBy: { createdAt: 'asc' } }),
    prisma.clientPayment.findMany({ where: { clientId } })
  ])

  const totalOwed = workOrders.reduce((s, p) => s + Number(p.totalAmount), 0)
  const totalPaid = clientPayments.reduce((s, p) => s + Number(p.amount), 0)

  // FIFO: cover work orders in chronological order
  let remaining = totalPaid
  await Promise.all(
    workOrders.map(wo => {
      const amount = Number(wo.totalAmount)
      const covered = Math.min(remaining, amount)
      remaining = Math.max(0, remaining - amount)
      const status: PaymentStatus =
        covered >= amount ? 'PAID' : covered > 0 ? 'PARTIAL' : 'PENDING'
      return prisma.payment.update({ where: { id: wo.id }, data: { status } })
    })
  )

  return { totalOwed, totalPaid, balance: totalOwed - totalPaid }
}
