import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import type { Client } from '../types'

const fmt = (n: number) => `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [name, setName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const navigate = useNavigate()

  const load = () => api.get<Client[]>('/clients').then(r => setClients(r.data))
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setName(''); setContactEmail(''); setPhone(''); setNotes(''); setShowForm(true) }
  const openEdit = (c: Client) => { setEditing(c); setName(c.name); setContactEmail(c.contactEmail ?? ''); setPhone(c.phone ?? ''); setNotes(c.notes ?? ''); setShowForm(true) }

  const save = async () => {
    if (!name.trim()) return
    if (editing) {
      await api.put(`/clients/${editing.id}`, { name, contactEmail, phone, notes })
    } else {
      await api.post('/clients', { name, contactEmail, phone, notes })
    }
    setShowForm(false)
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('למחוק את הלקוח?')) return
    await api.delete(`/clients/${id}`)
    load()
  }

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">לקוחות</h2>
        <button onClick={openNew} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors">
          <Plus size={16} /> לקוח חדש
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="font-medium text-slate-800">{editing ? 'עריכת לקוח' : 'לקוח חדש'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">שם *</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">אימייל</label>
              <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} dir="ltr" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">טלפון</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onPaste={e => { e.preventDefault(); setPhone(e.clipboardData.getData('text')) }}
                dir="ltr"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">הערות</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">שמור</button>
            <button onClick={() => setShowForm(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-200">ביטול</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {clients.length === 0 ? (
          <p className="text-slate-400 text-sm p-6">אין לקוחות עדיין.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-slate-600">שם</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">אימייל</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">טלפון</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">תשלומים</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <button onClick={() => navigate(`/clients/${c.id}`)} className="hover:text-indigo-600 flex items-center gap-1">
                      {c.name} <ChevronLeft size={14} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dir-ltr">{c.contactEmail ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500 dir-ltr">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{c._count?.payments ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(c.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
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
