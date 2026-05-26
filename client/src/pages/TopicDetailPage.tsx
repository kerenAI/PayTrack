import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, Plus, Users, Pencil } from 'lucide-react'
import api from '../api'
import type { Topic, Client, Payment, ClientPayment } from '../types'

const fmt = (n: number) => `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

interface ClientWithData extends Client {
  payments: Payment[]
  clientPayments: ClientPayment[]
}

export default function TopicDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [clients, setClients] = useState<ClientWithData[]>([])
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [editingClient, setEditingClient] = useState<ClientWithData | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editNotes, setEditNotes] = useState('')

  // add-payment form state per client
  const [showPayForm, setShowPayForm] = useState<string | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))
  const [payNotes, setPayNotes] = useState('')

  const load = async () => {
    const [topicsRes, clientsRes] = await Promise.all([
      api.get<Topic[]>('/topics'),
      api.get<ClientWithData[]>(`/clients?topicId=${id}`)
    ])
    const found = topicsRes.data.find(t => t.id === id)
    setTopic(found ?? null)
    setClients(clientsRes.data)
  }

  useEffect(() => { load() }, [id])

  const openEditClient = (c: ClientWithData) => {
    setEditingClient(c)
    setEditName(c.name)
    setEditEmail(c.contactEmail ?? '')
    setEditPhone(c.phone ?? '')
    setEditNotes(c.notes ?? '')
  }

  const saveEditClient = async () => {
    if (!editingClient) return
    await api.put(`/clients/${editingClient.id}`, { name: editName, contactEmail: editEmail, phone: editPhone, notes: editNotes })
    setEditingClient(null)
    load()
  }

  const createClient = async () => {
    if (!newClientName.trim()) return
    await api.post<Client>('/clients', { name: newClientName, contactEmail: newClientEmail, phone: newClientPhone, topicId: id })
    setShowNewClient(false)
    setNewClientName('')
    setNewClientEmail('')
    setNewClientPhone('')
    load()
  }

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

  const totalInTopic = clients.reduce((sum, c) =>
    sum + (c.payments ?? []).reduce((s, p) => s + Number(p.totalAmount), 0), 0)

  if (!topic) return <div className="text-slate-400 text-sm" dir="rtl">טוען...</div>

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/topics')} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
          <ArrowRight size={16} />
        </button>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full" style={{ background: topic.color }} />
          <h2 className="text-xl font-semibold text-slate-900">{topic.name}</h2>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-slate-900">{clients.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">לקוחות</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-slate-900">{fmt(totalInTopic)}</div>
          <div className="text-xs text-slate-500 mt-0.5">סך חיובים בנושא</div>
        </div>
      </div>

      {/* Clients list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-700">לקוחות</h3>
          <button onClick={() => setShowNewClient(!showNewClient)} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700">
            <Plus size={14} /> לקוח חדש
          </button>
        </div>

        {showNewClient && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-medium text-slate-700">לקוח חדש</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">שם *</label>
                <input value={newClientName} onChange={e => setNewClientName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">אימייל</label>
                <input value={newClientEmail} onChange={e => setNewClientEmail(e.target.value)} dir="ltr" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">טלפון</label>
                <input value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)}
                  onPaste={e => { e.preventDefault(); setNewClientPhone(e.clipboardData.getData('text')) }}
                  dir="ltr" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={createClient} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">שמור</button>
              <button onClick={() => setShowNewClient(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-200">ביטול</button>
            </div>
          </div>
        )}

        {clients.length === 0 && !showNewClient && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <Users size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">אין לקוחות בנושא זה עדיין.</p>
          </div>
        )}

        {clients.map(client => {
          const workOrderTotal = (client.payments ?? []).reduce((s, p) => s + Number(p.totalAmount), 0)
          const isExpanded = expandedClient === client.id
          const clientPayments = client.clientPayments ?? []

          return (
            <div key={client.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {/* Client header */}
              <div className="flex items-center justify-between p-4">
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{client.name}</div>
                    <div className="text-xs text-slate-400">
                      {client.payments?.length ?? 0} הזמנות · {clientPayments.length} תשלומים
                      {client.phone && <span className="mr-2">{client.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <div className="text-sm font-semibold text-slate-900">{fmt(workOrderTotal)}</div>
                    <div className="text-xs text-slate-400">חיובים בנושא</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); openEditClient(client) }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <span className="text-slate-400 text-xs cursor-pointer" onClick={() => setExpandedClient(isExpanded ? null : client.id)}>{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Edit client form */}
              {editingClient?.id === client.id && (
                <div className="border-t border-indigo-100 bg-indigo-50 p-4 space-y-3">
                  <h4 className="text-sm font-medium text-slate-700">עריכת לקוח</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">שם *</label>
                      <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">אימייל</label>
                      <input value={editEmail} onChange={e => setEditEmail(e.target.value)} dir="ltr" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">טלפון</label>
                      <input value={editPhone} onChange={e => setEditPhone(e.target.value)}
                        onPaste={e => { e.preventDefault(); setEditPhone(e.clipboardData.getData('text')) }}
                        dir="ltr" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">הערות</label>
                      <input value={editNotes} onChange={e => setEditNotes(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEditClient} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">שמור</button>
                    <button onClick={() => setEditingClient(null)} className="bg-white text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-100 border border-slate-200">ביטול</button>
                  </div>
                </div>
              )}

              {/* Expanded: payments received */}
              {isExpanded && (
                <div className="border-t border-slate-100 p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-600">תשלומים שהתקבלו</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/clients/${client.id}`)}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        כל פרטי הלקוח ←
                      </button>
                      <button
                        onClick={() => openPayForm(client.id)}
                        className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-700"
                      >
                        <Plus size={12} /> הוסף תשלום
                      </button>
                    </div>
                  </div>

                  {showPayForm === client.id && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                  {clientPayments.length === 0 ? (
                    <p className="text-slate-400 text-xs">אין תשלומים עדיין.</p>
                  ) : (
                    clientPayments.map(cp => (
                      <div key={cp.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                        <div>
                          <div className="text-xs text-slate-400">{new Date(cp.date).toLocaleDateString('he-IL')}</div>
                          {cp.notes && <div className="text-xs text-slate-500">{cp.notes}</div>}
                        </div>
                        <span className="text-sm font-medium text-emerald-700">{fmt(Number(cp.amount))}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
