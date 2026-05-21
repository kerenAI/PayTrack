import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import type { Payment, PaymentStatus } from '../types'
import StatusBadge from '../components/StatusBadge'

const fmt = (n: number) => `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const statuses: { value: string; label: string }[] = [
  { value: '', label: 'הכל' },
  { value: 'PENDING', label: 'ממתין' },
  { value: 'PARTIAL', label: 'חלקי' },
  { value: 'PAID', label: 'שולם' },
  { value: 'OVERDUE', label: 'באיחור' },
  { value: 'CREDITED', label: 'זיכוי' },
]

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const params = statusFilter ? `?status=${statusFilter}` : ''
    api.get<Payment[]>(`/payments${params}`).then(r => setPayments(r.data))
  }, [statusFilter])

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">תשלומים</h2>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${statusFilter === s.value ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {payments.length === 0 ? (
          <p className="text-slate-400 text-sm p-6">אין תשלומים.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-slate-600">לקוח</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">נושא</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">תיאור</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">סכום</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">תאריך יעד</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">סטטוס</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/payments/${p.id}`)}>
                  <td className="px-4 py-3 font-medium text-slate-900">{p.client?.name}</td>
                  <td className="px-4 py-3 text-slate-500">{p.topic?.name}</td>
                  <td className="px-4 py-3 text-slate-600">{p.description || '—'}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{fmt(Number(p.totalAmount))}</td>
                  <td className="px-4 py-3 text-slate-500">{p.dueDate ? new Date(p.dueDate).toLocaleDateString('he-IL') : '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status as PaymentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
