import { PaymentStatus } from '@prisma/client'
import prisma from './prisma'

export async function refreshClientWorkOrderStatuses(clientId: string) {
  const [workOrders, clientPayments] = await Promise.all([
    prisma.payment.findMany({ where: { clientId } }),
    prisma.clientPayment.findMany({ where: { clientId } })
  ])

  const totalOwed = workOrders.reduce((s, p) => s + Number(p.totalAmount), 0)
  const totalPaid = clientPayments.reduce((s, p) => s + Number(p.amount), 0)
  const ratio = totalOwed > 0 ? totalPaid / totalOwed : 0

  const status = (ratio: number): PaymentStatus =>
    ratio <= 0 ? 'PENDING' : ratio >= 1 ? 'PAID' : 'PARTIAL'

  await Promise.all(
    workOrders.map(wo =>
      prisma.payment.update({ where: { id: wo.id }, data: { status: status(ratio) } })
    )
  )

  return { totalOwed, totalPaid, balance: totalOwed - totalPaid, coverageRatio: ratio }
}
