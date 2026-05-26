import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import api from '../api'
import type { Expense, Supplier, ExpenseCategory } from '../types'

const fmt = (n: number) => `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const emptyForm = () => ({
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  description: '',
  notes: '',
  supplierId: '',
  categoryId: ''
})

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [form, setForm] = useState(emptyForm())

  const load = () => {
    Promise.all([
      api.get<Expense[]>('/expenses'),
      api.get<Supplier[]>('/suppliers'),
      api.get<ExpenseCategory[]>('/expense-categories')
    ]).then(([e, s, c]) => {
      setExpenses(e.data)
      setSuppliers(s.data)
      setCategories(c.data)
    })
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  const openEdit = (e: Expense) => {
    setEditing(e)
    setForm({
      amount: String(Number(e.amount)),
      date: e.date.slice(0, 10),
      description: e.description ?? '',
      notes: e.notes ?? '',
      supplierId: e.supplierId ?? '',
      categoryId: e.categoryId ?? ''
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.amount || !form.date) return
    const payload = {
      amount: Number(form.amount),
      date: form.date,
      description: form.description,
      notes: form.notes,
      supplierId: form.supplierId || null,
      categoryId: form.categoryId || null
    }
    if (editing) {
      await api.put(`/expenses/${editing.id}`, payload)
    } else {
      await api.post('/expenses', payload)
    }
    setShowForm(false)
    setEditing(null)
    load()
  }

  const del = async (id: string) => {
    if (!confirm('למחוק הוצאה זו?')) return
    await api.delete(`/expenses/${id}`)
    load()
  }

  const field = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">הוצאות</h2>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700">
          <Plus size={14} /> הוצאה חדשה
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-red-200 rounded-xl p-5 space-y-4">
          <h3 className="font-medium text-slate-800">{editing ? 'עריכת הוצאה' : 'הוצאה חדשה'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">סכום *</label>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={e => field('amount', e.target.value)}
                dir="ltr" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">תאריך *</label>
              <input type="date" value={form.date} onChange={e => field('date', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">תיאור</label>
              <input value={form.description} onChange={e => field('description', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">ספק</label>
              <select value={form.supplierId} onChange={e => field('supplierId', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">— ללא ספק —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">קטגוריה</label>
              <select value={form.categoryId} onChange={e => field('categoryId', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">— ללא קטגוריה —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">הערות</label>
              <input value={form.notes} onChange={e => field('notes', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">שמור</button>
            <button onClick={() => setShowForm(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-200">ביטול</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {expenses.length === 0 ? (
          <p className="text-slate-400 text-sm p-6">אין הוצאות עדיין.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-slate-600">תאריך</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">תיאור</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">ספק</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">קטגוריה</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">סכום</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{new Date(e.date).toLocaleDateString('he-IL')}</td>
                  <td className="px-4 py-3 text-slate-700">{e.description || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{e.supplier?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {e.category ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: e.category.color }} />
                        <span className="text-slate-600">{e.category.name}</span>
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-red-600">{fmt(Number(e.amount))}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(e)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => del(e.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
