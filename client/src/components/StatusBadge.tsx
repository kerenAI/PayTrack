import type { PaymentStatus } from '../types'

const config: Record<PaymentStatus, { label: string; dot: string; className: string }> = {
  PENDING:  { label: 'ממתין',  dot: 'bg-slate-400',   className: 'bg-slate-100 text-slate-600 ring-slate-200' },
  PARTIAL:  { label: 'חלקי',   dot: 'bg-blue-500',    className: 'bg-blue-50 text-blue-700 ring-blue-200' },
  PREPAID:  { label: 'מראש',   dot: 'bg-violet-500',  className: 'bg-violet-50 text-violet-700 ring-violet-200' },
  PAID:     { label: 'שולם',   dot: 'bg-emerald-500', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  OVERDUE:  { label: 'באיחור', dot: 'bg-red-500',     className: 'bg-red-50 text-red-700 ring-red-200' },
  CREDITED: { label: 'זיכוי',  dot: 'bg-amber-500',   className: 'bg-amber-50 text-amber-700 ring-amber-200' },
}

export default function StatusBadge({ status }: { status: PaymentStatus }) {
  const { label, dot, className } = config[status]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
