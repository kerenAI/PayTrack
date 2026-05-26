import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, Plus, Trash2 } from 'lucide-react'
import api from '../api'
import type { Topic, ClientWithBalance, WorkOrder, ClientPayment } from '../types'
import StatusBadge from '../components/StatusBadge'
import PaymentForm from '../components/PaymentForm'

const fmt = (n: number) => `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<ClientWithBalance | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [showWorkOrderForm, setShowWorkOrderForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))
  const [payNotes, setPayNotes] = useState('')

  const load = () => {
    api.get<ClientWithBalance>(`/clients/${id}`).then(r => setClient(r.data))
    api.get<Topic[]>('/topics').then(r => setTopics(r.data))
  }

  useEffect(() => { load() }, [id])

  const addPayment = async () => {
    if (!payAmount) return
    await api.post('/client-payments', { clientId: id, amount: Number(payAmount), date: payDate, notes: payNotes })
    setShowPaymentForm(false)
    setPayAmount('')
    setPayNotes('')
    load()
  }

  const deletePayment = async (payId: string) => {
    if (!confirm('למחוק תשלום זה?')) return
    await api.delete(`/client-payments/${payId}`)
    load()
  }

  const deleteWorkOrder = async (woId: string) => {
    if (!confirm('למחוק הזמנה זו?')) return
    await api.delete(`/payments/${woId}`)
    load()
  }

  if (!client) return <div className="text-slate-400 text-sm" dir="rtl">טוען...</div>

  const balancePositive = client.balance <= 0

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
          <ArrowRight size={16} />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{client.name}</h2>
          <div className="flex gap-4 text-xs text-slate-400 mt-0.5">
            {client.contactEmail && <span>{client.contactEmail}</span>}
            {client.phone && <span>{client.phone}</span>}
            {client.notes && <span className="text-slate-500">{client.notes}</span>}
          </div>
        </div>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-slate-900">{fmt(client.totalOwed)}</div>
          <div className="text-xs text-slate-500 mt-0.5">סך הזמנות</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-emerald-600">{fmt(client.totalPaid)}</div>
          <div className="text-xs text-slate-500 mt-0.5">סך שולם</div>
        </div>
        <div className={`border rounded-xl p-4 text-center ${balancePositive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`text-xl font-bold ${balancePositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {balancePositive ? `זיכוי ${fmt(Math.abs(client.balance))}` : fmt(client.balance)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{balancePositive ? 'זיכוי' : 'יתרת חוב'}</div>
        </div>
      </div>


      {/* Work Orders */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-800">הזמנות עבודה</h3>
          <button onClick={() => setShowWorkOrderForm(!showWorkOrderForm)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700">
            <Plus size={14} /> הזמנה חדשה
          </button>
        </div>

        {showWorkOrderForm && (
          <PaymentForm
            clientId={id!}
            topics={topics}
            onSaved={() => { setShowWorkOrderForm(false); load() }}
            onCancel={() => setShowWorkOrderForm(false)}
          />
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {client.workOrders.length === 0 ? (
            <p className="text-slate-400 text-sm p-6">אין הזמנות עבודה עדיין.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">תיאור</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">נושא</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">סכום</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">סטטוס</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {client.workOrders.map((wo: WorkOrder) => (
                  <tr key={wo.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800">
                      <button onClick={() => navigate(`/payments/${wo.id}`)} className="hover:text-indigo-600 text-right">
                        {wo.description || '—'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{wo.topic?.name}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{fmt(Number(wo.totalAmount))}</td>
                    <td className="px-4 py-3"><StatusBadge status={wo.status} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteWorkOrder(wo.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

      {/* Client Payments */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-800">הכנסות</h3>
          <button onClick={() => setShowPaymentForm(!showPaymentForm)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-emerald-700">
            <Plus size={14} /> הוסף תשלום
          </button>
        </div>

        {showPaymentForm && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">סכום *</label>
                <input type="number" min="0" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  dir="ltr" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">תאריך *</label>
                <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">הערות</label>
                <input value={payNotes} onChange={e => setPayNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addPayment} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700">שמור</button>
              <button onClick={() => setShowPaymentForm(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-200">ביטול</button>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {client.clientPayments.length === 0 ? (
            <p className="text-slate-400 text-sm p-6">אין תשלומים עדיין.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">תאריך</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">סכום</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">הערות</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {client.clientPayments.map((cp: ClientPayment) => (
                  <tr key={cp.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{new Date(cp.date).toLocaleDateString('he-IL')}</td>
                    <td className="px-4 py-3 font-medium text-emerald-700">{fmt(Number(cp.amount))}</td>
                    <td className="px-4 py-3 text-slate-500">{cp.notes ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => deletePayment(cp.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
    </div>
  )
}
