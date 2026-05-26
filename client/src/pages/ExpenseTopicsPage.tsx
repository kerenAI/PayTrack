import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import type { ExpenseCategory } from '../types'

export default function ExpenseTopicsPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ExpenseCategory | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#f59e0b')

  const load = () => api.get<ExpenseCategory[]>('/expense-categories').then(r => setCategories(r.data))
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setName(''); setColor('#f59e0b'); setShowForm(true) }
  const openEdit = (c: ExpenseCategory) => { setEditing(c); setName(c.name); setColor(c.color); setShowForm(true) }

  const save = async () => {
    if (!name.trim()) return
    if (editing) {
      await api.put(`/expense-categories/${editing.id}`, { name, color })
    } else {
      await api.post('/expense-categories', { name, color })
    }
    setShowForm(false)
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('למחוק נושא זה?')) return
    await api.delete(`/expense-categories/${id}`)
    load()
  }

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">נושאים</h2>
        <button onClick={openNew} className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600 transition-colors">
          <Plus size={16} /> נושא חדש
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="font-medium text-slate-800">{editing ? 'עריכת נושא' : 'נושא חדש'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">שם</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">צבע</label>
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-300 cursor-pointer" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600">שמור</button>
            <button onClick={() => setShowForm(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-200">ביטול</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(c => (
          <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <button onClick={() => navigate(`/expense-topics/${c.id}`)} className="flex items-center gap-2 hover:text-amber-600 transition-colors">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.color }} />
                <span className="font-medium text-slate-900">{c.name}</span>
                <ChevronLeft size={14} className="text-slate-400" />
              </button>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => remove(c.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400">{c._count?.expenses ?? 0} הוצאות</p>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-slate-400 text-sm col-span-3">אין נושאים עדיין. צור את הראשון!</p>
        )}
      </div>
    </div>
  )
}
