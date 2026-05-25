import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, Plus, Users, Pencil } from 'lucide-react'
import api from '../api'
import type { Topic, Client, Payment } from '../types'
import StatusBadge from '../components/StatusBadge'
import PaymentForm from '../components/PaymentForm'

const fmt = (n: number) => `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

interface ClientWithPayments extends Client {
  payments: Payment[]
}

export default function TopicDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [clients, setClients] = useState<ClientWithPayments[]>([])
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null)
  const [allTopics, setAllTopics] = useState<Topic[]>([])
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [editingClient, setEditingClient] = useState<ClientWithPayments | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const load = async () => {
    const [topicsRes, clientsRes] = await Promise.all([
      api.get<Topic[]>('/topics'),
      api.get<ClientWithPayments[]>(`/clients?topicId=${id}`)
    ])
    const found = topicsRes.data.find(t => t.id === id)
    setTopic(found ?? null)
    setClients(clientsRes.data)
    setAllTopics(topicsRes.data)
  }

  const openEditClient = (c: ClientWithPayments) => {
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
    const res = await api.post<Client>('/clients', { name: newClientName, contactEmail: newClientEmail, phone: newClientPhone, topicId: id })
    const newClient: ClientWithPayments = { ...res.data, payments: [] }
    setClients(prev => [newClient, ...prev])
    setExpandedClient(newClient.id)
    setShowPaymentForm(newClient.id)
    setShowNewClient(false)
    setNewClientName('')
    setNewClientEmail('')
    setNewClientPhone('')
  }

  useEffect(() => { load() }, [id])

  const totalInTopic = clients.reduce((sum, c) =>
    sum + (c.payments ?? []).reduce((s, p) => s + Number(p.totalAmount), 0), 0)

  const paidInTopic = 0 // balance is now global per client, shown on client detail page

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
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-slate-900">{clients.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">לקוחות</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-slate-900">{fmt(totalInTopic)}</div>
          <div className="text-xs text-slate-500 mt-0.5">סך חיובים</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-emerald-600">{fmt(paidInTopic)}</div>
          <div className="text-xs text-slate-500 mt-0.5">סך שולם</div>
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
                <input
                  value={newClientPhone}
                  onChange={e => setNewClientPhone(e.target.value)}
                  onPaste={e => { e.preventDefault(); setNewClientPhone(e.clipboardData.getData('text')) }}
                  dir="ltr"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
          const clientTotal = (client.payments ?? []).reduce((s, p) => s + Number(p.totalAmount), 0)
          const isExpanded = expandedClient === client.id

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
                      {client.payments?.length ?? 0} תשלומים
                      {client.phone && <span className="mr-2">{client.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <div className="text-sm font-semibold text-slate-900">{fmt(clientTotal)}</div>
                    <div className="text-xs text-slate-400">{client.payments?.length ?? 0} הזמנות</div>
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
                      <input
                        value={editPhone}
                        onChange={e => setEditPhone(e.target.value)}
                        onPaste={e => { e.preventDefault(); setEditPhone(e.clipboardData.getData('text')) }}
                        dir="ltr"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
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

              {/* Expanded payments */}
              {isExpanded && (
                <div className="border-t border-slate-100 p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">תשלומים</span>
                    <button
                      onClick={() => setShowPaymentForm(showPaymentForm === client.id ? null : client.id)}
                      className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-700"
                    >
                      <Plus size={12} /> תשלום חדש
                    </button>
                  </div>

                  {showPaymentForm === client.id && (
                    <PaymentForm
                      clientId={client.id}
                      topics={allTopics}
                      defaultTopicId={id}
                      onSaved={() => { setShowPaymentForm(null); load() }}
                      onCancel={() => setShowPaymentForm(null)}
                    />
                  )}

                  {(client.payments ?? []).length === 0 && (
                    <p className="text-slate-400 text-xs">אין תשלומים עדיין.</p>
                  )}

                  {(client.payments ?? []).map(p => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 cursor-pointer hover:text-indigo-600"
                      onClick={() => navigate(`/payments/${p.id}`)}
                    >
                      <div>
                        <div className="text-sm text-slate-800">{p.description || '—'}</div>
                        {p.dueDate && <div className="text-xs text-slate-400">{new Date(p.dueDate).toLocaleDateString('he-IL')}</div>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{fmt(Number(p.totalAmount))}</span>
                        <StatusBadge status={p.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
