import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, Plus, Trash2, Pencil } from 'lucide-react'
import api from '../api'
import type { Payment, TransactionType, Topic } from '../types'
import StatusBadge from '../components/StatusBadge'

const fmt = (n: number) => `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const txLabels: Record<TransactionType, string> = {
  PAYMENT: 'תשלום',
  CREDIT: 'זיכוי',
  PREPAYMENT: 'מקדמה',
  PREPAYMENT_APPLY: 'ייחוס מקדמה',
}

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])

  // Edit payment
  const [showEdit, setShowEdit] = useState(false)
  const [editAmount, setEditAmount] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTopicId, setEditTopicId] = useState('')
  const [editRecurring, setEditRecurring] = useState(false)

  // New transaction
  const [showTxForm, setShowTxForm] = useState(false)
  const [txAmount, setTxAmount] = useState('')
  const [txType, setTxType] = useState<TransactionType>('PAYMENT')
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10))
  const [txNotes, setTxNotes] = useState('')

  const load = () => api.get<Payment>(`/payments/${id}`).then(r => setPayment(r.data))

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

  const addTransaction = async () => {
    if (!txAmount) return
    await api.post(`/payments/${id}/transactions`, { amount: Number(txAmount), type: txType, date: txDate, notes: txNotes })
    setShowTxForm(false)
    setTxAmount('')
    setTxNotes('')
    load()
  }

  const deleteTransaction = async (txId: string) => {
    if (!confirm('למחוק תנועה זו?')) return
    await api.delete(`/payments/${id}/transactions/${txId}`)
    load()
  }

  if (!payment) return <div className="text-slate-400 text-sm" dir="rtl">טוען...</div>

  const paid = (payment.transactions ?? [])
    .filter(t => t.type === 'PAYMENT' || t.type === 'PREPAYMENT_APPLY')
    .reduce((s, t) => s + Number(t.amount), 0)
  const remaining = Number(payment.totalAmount) - paid

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
            <ArrowRight size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-900">{payment.description || 'תשלום'}</h2>
              <StatusBadge status={payment.status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{payment.client?.name} · {payment.topic?.name}</p>
          </div>
        </div>
        <button onClick={openEdit} className="flex items-center gap-2 border border-slate-200 bg-white text-slate-600 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50">
          <Pencil size={14} /> עריכה
        </button>
      </div>

      {/* Edit form */}
      {showEdit && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 space-y-4">
          <h3 className="font-medium text-slate-800">עריכת תשלום</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">סכום כולל</label>
              <input type="number" min="0" step="0.01" value={editAmount} onChange={e => setEditAmount(e.target.value)} dir="ltr" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">תאריך יעד</label>
              <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">תיאור</label>
              <input value={editDescription} onChange={e => setEditDescription(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">נושא</label>
              <select value={editTopicId} onChange={e => setEditTopicId(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="edit-recurring" checked={editRecurring} onChange={e => setEditRecurring(e.target.checked)} className="rounded border-slate-300" />
              <label htmlFor="edit-recurring" className="text-sm text-slate-600">תשלום חוזר</label>
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
          <div className="text-xl font-bold text-slate-900">{fmt(Number(payment.totalAmount))}</div>
          <div className="text-xs text-slate-500 mt-0.5">סכום כולל</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-emerald-600">{fmt(paid)}</div>
          <div className="text-xs text-slate-500 mt-0.5">שולם</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className={`text-xl font-bold ${remaining > 0 ? 'text-red-600' : 'text-slate-400'}`}>{fmt(remaining)}</div>
          <div className="text-xs text-slate-500 mt-0.5">נותר</div>
        </div>
      </div>

      {/* Transactions */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-800">תנועות</h3>
        <button onClick={() => setShowTxForm(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700">
          <Plus size={14} /> הוסף תנועה
        </button>
      </div>

      {showTxForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h4 className="font-medium text-slate-800">תנועה חדשה</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">סוג</label>
              <select value={txType} onChange={e => setTxType(e.target.value as TransactionType)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="PAYMENT">תשלום</option>
                <option value="CREDIT">זיכוי</option>
                <option value="PREPAYMENT_APPLY">ייחוס מקדמה</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">סכום</label>
              <input type="number" min="0" step="0.01" value={txAmount} onChange={e => setTxAmount(e.target.value)} dir="ltr" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">תאריך</label>
              <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">הערות</label>
              <input value={txNotes} onChange={e => setTxNotes(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addTransaction} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">שמור</button>
            <button onClick={() => setShowTxForm(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-200">ביטול</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {!payment.transactions?.length ? (
          <p className="text-slate-400 text-sm p-6">אין תנועות עדיין.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-slate-600">סוג</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">סכום</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">תאריך</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">הערות</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payment.transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{txLabels[tx.type]}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{fmt(Number(tx.amount))}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(tx.date).toLocaleDateString('he-IL')}</td>
                  <td className="px-4 py-3 text-slate-500">{tx.notes ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteTransaction(tx.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
