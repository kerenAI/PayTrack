import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import api from '../api'
import type { Payment, Topic, Client } from '../types'
import StatusBadge from '../components/StatusBadge'

const fmt = (n: number) => `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export default function ReportsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [topicId, setTopicId] = useState('')
  const [clientId, setClientId] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    api.get<Topic[]>('/topics').then(r => setTopics(r.data))
    api.get<Client[]>('/clients').then(r => setClients(r.data))
  }, [])

  const search = () => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (topicId) params.set('topicId', topicId)
    if (clientId) params.set('clientId', clientId)
    if (status) params.set('status', status)
    api.get<Payment[]>(`/reports?${params}`).then(r => setPayments(r.data))
  }

  const downloadCsv = () => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (topicId) params.set('topicId', topicId)
    if (clientId) params.set('clientId', clientId)
    window.open(`/api/reports/csv?${params}`, '_blank')
  }

  const total = payments.reduce((s, p) => s + Number(p.totalAmount), 0)
  const paid = payments.flatMap(p => p.transactions ?? [])
    .filter(t => t.type === 'PAYMENT' || t.type === 'PREPAYMENT_APPLY')
    .reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">דוחות</h2>
        <button onClick={downloadCsv} className="flex items-center gap-2 border border-slate-200 bg-white text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-50">
          <Download size={15} /> ייצוא CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">מתאריך</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">עד תאריך</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">נושא</label>
            <select value={topicId} onChange={e => setTopicId(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">הכל</option>
              {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">לקוח</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">הכל</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">סטטוס</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">הכל</option>
              <option value="PENDING">ממתין</option>
              <option value="PARTIAL">חלקי</option>
              <option value="PAID">שולם</option>
              <option value="OVERDUE">באיחור</option>
              <option value="CREDITED">זיכוי</option>
            </select>
          </div>
        </div>
        <button onClick={search} className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700">חפש</button>
      </div>

      {payments.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-slate-900">{fmt(total)}</div>
            <div className="text-xs text-slate-500 mt-0.5">סך חיובים</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-emerald-600">{fmt(paid)}</div>
            <div className="text-xs text-slate-500 mt-0.5">סך שולם</div>
          </div>
        </div>
      )}

      {payments.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
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
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{p.client?.name}</td>
                  <td className="px-4 py-3 text-slate-500">{p.topic?.name}</td>
                  <td className="px-4 py-3 text-slate-600">{p.description || '—'}</td>
                  <td className="px-4 py-3 font-medium">{fmt(Number(p.totalAmount))}</td>
                  <td className="px-4 py-3 text-slate-500">{p.dueDate ? new Date(p.dueDate).toLocaleDateString('he-IL') : '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
