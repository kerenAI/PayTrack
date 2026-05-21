import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import type { Topic } from '../types'

export default function TopicsPage() {
  const navigate = useNavigate()
  const [topics, setTopics] = useState<Topic[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Topic | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#6366f1')

  const load = () => api.get<Topic[]>('/topics').then(r => setTopics(r.data))
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setName(''); setDescription(''); setColor('#6366f1'); setShowForm(true) }
  const openEdit = (t: Topic) => { setEditing(t); setName(t.name); setDescription(t.description ?? ''); setColor(t.color); setShowForm(true) }

  const save = async () => {
    if (!name.trim()) return
    if (editing) {
      await api.put(`/topics/${editing.id}`, { name, description, color })
    } else {
      await api.post('/topics', { name, description, color })
    }
    setShowForm(false)
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('למחוק את הנושא?')) return
    await api.delete(`/topics/${id}`)
    load()
  }

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">נושאים</h2>
        <button onClick={openNew} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors">
          <Plus size={16} /> נושא חדש
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="font-medium text-slate-800">{editing ? 'עריכת נושא' : 'נושא חדש'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">שם</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">צבע</label>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-9 w-full rounded-lg border border-slate-300 cursor-pointer" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">תיאור</label>
              <input value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">שמור</button>
            <button onClick={() => setShowForm(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-200">ביטול</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map(t => (
          <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <button onClick={() => navigate(`/topics/${t.id}`)} className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: t.color }} />
                <span className="font-medium text-slate-900">{t.name}</span>
                <ChevronLeft size={14} className="text-slate-400" />
              </button>
              <div className="flex gap-1">
                <button onClick={() => openEdit(t)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => remove(t.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {t.description && <p className="text-sm text-slate-500 mb-2">{t.description}</p>}
            <p className="text-xs text-slate-400">{t._count?.payments ?? 0} תשלומים</p>
          </div>
        ))}
        {topics.length === 0 && (
          <p className="text-slate-400 text-sm col-span-3">אין נושאים עדיין. צור את הראשון!</p>
        )}
      </div>
    </div>
  )
}
