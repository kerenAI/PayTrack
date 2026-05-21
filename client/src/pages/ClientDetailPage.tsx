import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, Plus } from 'lucide-react'
import api from '../api'
import type { Client, Payment, Topic } from '../types'
import StatusBadge from '../components/StatusBadge'
import PaymentForm from '../components/PaymentForm'

const fmt = (n: number) => `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client & { payments: Payment[] } | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [showForm, setShowForm] = useState(false)

  const load = () => {
    api.get<Client & { payments: Payment[] }>(`/clients/${id}`).then(r => setClient(r.data))
    api.get<Topic[]>('/topics').then(r => setTopics(r.data))
  }

  useEffect(() => { load() }, [id])

  if (!client) return <div className="text-slate-400 text-sm" dir="rtl">טוען...</div>

  const paidTotal = client.payments
    .flatMap(p => p.transactions ?? [])
    .filter(t => t.type === 'PAYMENT' || t.type === 'PREPAYMENT_APPLY')
    .reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/clients')} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
          <ArrowRight size={16} />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{client.name}</h2>
          <div className="flex gap-4 text-xs text-slate-400 mt-0.5">
            {client.contactEmail && <span>{client.contactEmail}</span>}
            {client.phone && <span>{client.phone}</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-slate-900">{fmt(client.payments.reduce((s, p) => s + Number(p.totalAmount), 0))}</div>
          <div className="text-xs text-slate-500 mt-0.5">סך חיובים</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-emerald-600">{fmt(paidTotal)}</div>
          <div className="text-xs text-slate-500 mt-0.5">שולם</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-purple-600">{fmt(client.prepaymentBalance ?? 0)}</div>
          <div className="text-xs text-slate-500 mt-0.5">מקדמה פתוחה</div>
        </div>
      </div>

      {/* Payments */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-800">תשלומים</h3>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700">
          <Plus size={14} /> תשלום חדש
        </button>
      </div>

      {showForm && (
        <PaymentForm
          clientId={id!}
          topics={topics}
          onSaved={() => { setShowForm(false); load() }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {client.payments.length === 0 ? (
          <p className="text-slate-400 text-sm p-6">אין תשלומים עדיין.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-slate-600">תיאור</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">נושא</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">סכום</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">תאריך יעד</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">סטטוס</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {client.payments.map(p => {
                const paid = (p.transactions ?? [])
                  .filter(t => t.type === 'PAYMENT' || t.type === 'PREPAYMENT_APPLY')
                  .reduce((s, t) => s + Number(t.amount), 0)
                const remaining = Number(p.totalAmount) - paid
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800">
                      <button onClick={() => navigate(`/payments/${p.id}`)} className="hover:text-indigo-600 text-right">
                        {p.description || '—'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.topic?.name}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {fmt(Number(p.totalAmount))}
                      {remaining > 0 && remaining < Number(p.totalAmount) && (
                        <span className="text-xs text-slate-400 mr-1">({fmt(remaining)} נותר)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {p.dueDate ? new Date(p.dueDate).toLocaleDateString('he-IL') : '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3" />
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
