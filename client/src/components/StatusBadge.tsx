import type { PaymentStatus } from '../types'

const config: Record<PaymentStatus, { label: string; className: string }> = {
  PENDING:         { label: 'ממתין',    className: 'bg-slate-100 text-slate-600' },
  PARTIAL:         { label: 'חלקי',     className: 'bg-blue-100 text-blue-700' },
  PREPAID:         { label: 'מראש',     className: 'bg-purple-100 text-purple-700' },
  PAID:            { label: 'שולם',     className: 'bg-emerald-100 text-emerald-700' },
  OVERDUE:         { label: 'באיחור',   className: 'bg-red-100 text-red-700' },
  CREDITED:        { label: 'זיכוי',    className: 'bg-amber-100 text-amber-700' },
}

export default function StatusBadge({ status }: { status: PaymentStatus }) {
  const { label, className } = config[status]
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  )
}
