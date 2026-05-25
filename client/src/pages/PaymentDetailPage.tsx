import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, Pencil } from 'lucide-react'
import api from '../api'
import type { Payment, Topic, ClientWithBalance } from '../types'
import StatusBadge from '../components/StatusBadge'

const fmt = (n: number) => `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [clientBalance, setClientBalance] = useState<ClientWithBalance | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])

  const [showEdit, setShowEdit] = useState(false)
  const [editAmount, setEditAmount] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTopicId, setEditTopicId] = useState('')
  const [editRecurring, setEditRecurring] = useState(false)

  const load = async () => {
    const r = await api.get<Payment>(`/payments/${id}`)
    setPayment(r.data)
    if (r.data.clientId) {
      api.get<ClientWithBalance>(`/clients/${r.data.clientId}`).then(cr => setClientBalance(cr.data))
    }
  }

  useEffect(() => {
    load()
    api.get<Topic[]>('/topics').then(r => setTopics(r.data))
  }, [id])

  const openEdit = () => {
    if (!payment) return
    setEditAmount(String(Number(payment.totalAmount)))
    setEditDueDate(payment.dueDate ? payment.dueDate.slice(0, 10) : '')
    setEditDescription(payment.description ?? '')
    setEditTopicId(payment.topicId)
    setEditRecurring(payment.isRecurring)
    setShowEdit(true)
  }

  const saveEdit = async () => {
    await api.put(`/payments/${id}`, {
      totalAmount: Number(editAmount),
      dueDate: editDueDate || null,
      description: editDescription,
      topicId: editTopicId,
      isRecurring: editRecurring
    })
    setShowEdit(false)
    load()
  }

  if (!payment) return <div className="text-slate-400 text-sm" dir="rtl">טוען...</div>

  const totalAmount = Number(payment.totalAmount)
  const wo = clientBalance?.workOrders?.find(w => w.id === id)
  const coveredAmount = wo?.coveredAmount ?? 0
  const remaining = totalAmount - coveredAmount
  const coveragePct = totalAmount > 0 ? Math.min(Math.round((coveredAmount / totalAmount) * 100), 100) : 0

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
            <ArrowRight size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-900">{payment.description || 'הזמנת עבודה'}</h2>
              <StatusBadge status={payment.status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {payment.client?.name} · {payment.topic?.name}
            </p>
          </div>
        </div>
        <button onClick={openEdit} className="flex items-center gap-2 border border-slate-200 bg-white text-slate-600 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50">
          <Pencil size={14} /> עריכה
        </button>
      </div>

      {/* Edit form */}
      {showEdit && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 space-y-4">
          <h3 className="font-medium text-slate-800">עריכת הזמנת עבודה</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">סכום</label>
              <input type="number" min="0" step="0.01" value={editAmount} onChange={e => setEditAmount(e.target.value)} dir="ltr"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">תאריך יעד</label>
              <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">תיאור</label>
              <input value={editDescription} onChange={e => setEditDescription(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">נושא</label>
              <select value={editTopicId} onChange={e => setEditTopicId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="edit-recurring" checked={editRecurring} onChange={e => setEditRecurring(e.target.checked)} className="rounded border-slate-300" />
              <label htmlFor="edit-recurring" className="text-sm text-slate-600">הזמנה חוזרת</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveEdit} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">שמור</button>
            <button onClick={() => setShowEdit(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-200">ביטול</button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-slate-900">{fmt(totalAmount)}</div>
          <div className="text-xs text-slate-500 mt-0.5">סכום הזמנה</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-emerald-600">{fmt(coveredAmount)}</div>
          <div className="text-xs text-slate-500 mt-0.5">כוסה ({coveragePct}%)</div>
        </div>
        <div className={`border rounded-xl p-4 text-center ${remaining <= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
          <div className={`text-xl font-bold ${remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(remaining)}</div>
          <div className="text-xs text-slate-500 mt-0.5">נותר</div>
        </div>
      </div>

      {/* Coverage bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>כיסוי יחסי (מתוך מאזן הלקוח)</span>
          <span>{coveragePct}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${coveragePct}%` }} />
        </div>
        {clientBalance && (
          <p className="text-xs text-slate-400 mt-2">
            מאזן לקוח: {fmt(clientBalance.totalPaid)} שולם מתוך {fmt(clientBalance.totalOwed)} · יתרה {fmt(Math.abs(clientBalance.balance))} {clientBalance.balance > 0 ? 'חוב' : 'זיכוי'}
          </p>
        )}
      </div>
    </div>
  )
}
