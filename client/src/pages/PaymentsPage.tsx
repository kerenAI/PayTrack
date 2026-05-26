import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import api from '../api'

const fmt = (n: number) => `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

interface ClientPaymentRow {
  id: string
  amount: string
  date: string
  notes?: string
}

interface ClientRow {
  id: string
  name: string
  phone?: string
  totalOwed: number
  totalPaid: number
  balance: number
  clientPayments: ClientPaymentRow[]
}

export default function PaymentsPage() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<ClientRow[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  // add-payment form
  const [showPayForm, setShowPayForm] = useState<string | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))
  const [payNotes, setPayNotes] = useState('')

  const load = () => {
    api.get<ClientRow[]>('/clients').then(r => {
      setClients(r.data.filter(c => c.clientPayments.length > 0))
    })
  }

  useEffect(() => { load() }, [])

  const openPayForm = (clientId: string) => {
    setShowPayForm(clientId)
    setPayAmount('')
    setPayDate(new Date().toISOString().slice(0, 10))
    setPayNotes('')
  }

  const addPayment = async (clientId: string) => {
    if (!payAmount) return
    await api.post('/client-payments', { clientId, amount: Number(payAmount), date: payDate, notes: payNotes })
    setShowPayForm(null)
    load()
  }

  const deletePayment = async (payId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('למחוק תשלום זה?')) return
    await api.delete(`/client-payments/${payId}`)
    load()
  }

  const withPayments = clients.filter(c => c.clientPayments.length > 0)

  return (
    <div dir="rtl" className="space-y-5">
      <h2 className="text-xl font-semibold text-slate-900">תשלומים שהתקבלו</h2>

      {withPayments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
          אין תשלומים שהתקבלו עדיין.
        </div>
      ) : (
        <div className="space-y-2">
          {withPayments.map(client => {
            const isExpanded = expanded === client.id
            const balancePositive = client.balance <= 0

            return (
              <div key={client.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {/* Client row */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 select-none"
                  onClick={() => setExpanded(isExpanded ? null : client.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm flex-shrink-0">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{client.name}</div>
                      {client.phone && <div className="text-xs text-slate-400" dir="ltr">{client.phone}</div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-left">
                      <div className="text-sm font-semibold text-emerald-700">{fmt(client.totalPaid)}</div>
                      <div className="text-xs text-slate-400">שולם</div>
                    </div>
                    <div className="text-left">
                      <div className={`text-sm font-semibold ${balancePositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {balancePositive ? `זיכוי ${fmt(Math.abs(client.balance))}` : fmt(client.balance)}
                      </div>
                      <div className="text-xs text-slate-400">{balancePositive ? 'זיכוי' : 'יתרה לתשלום'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/clients/${client.id}`) }}
                        className="text-xs text-indigo-500 hover:underline"
                      >
                        פרטי לקוח
                      </button>
                      <span className="text-slate-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded payments */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 py-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        {client.clientPayments.length} תשלומים · סה"כ {fmt(client.totalPaid)}
                      </span>
                      <button
                        onClick={() => openPayForm(showPayForm === client.id ? '' : client.id)}
                        className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-700"
                      >
                        <Plus size={12} /> הוסף תשלום
                      </button>
                    </div>

                    {showPayForm === client.id && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">סכום *</label>
                            <input type="number" min="0" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                              dir="ltr" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" placeholder="0" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">תאריך *</label>
                            <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">הערות</label>
                            <input value={payNotes} onChange={e => setPayNotes(e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => addPayment(client.id)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700">שמור</button>
                          <button onClick={() => setShowPayForm(null)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-200">ביטול</button>
                        </div>
                      </div>
                    )}

                    <div className="divide-y divide-slate-50">
                      {client.clientPayments.map(cp => (
                        <div key={cp.id} className="flex items-center justify-between py-2">
                          <div>
                            <div className="text-xs text-slate-400">{new Date(cp.date).toLocaleDateString('he-IL')}</div>
                            {cp.notes && <div className="text-xs text-slate-500 mt-0.5">{cp.notes}</div>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-emerald-700">{fmt(Number(cp.amount))}</span>
                            <button onClick={e => deletePayment(cp.id, e)} className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
