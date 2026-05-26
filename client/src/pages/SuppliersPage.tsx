import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import api from '../api'
import type { Supplier, ExpenseCategory } from '../types'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])

  // supplier form
  const [showSupForm, setShowSupForm] = useState(false)
  const [editingSup, setEditingSup] = useState<Supplier | null>(null)
  const [supName, setSupName] = useState('')
  const [supEmail, setSupEmail] = useState('')
  const [supPhone, setSupPhone] = useState('')
  const [supNotes, setSupNotes] = useState('')

  // category form
  const [showCatForm, setShowCatForm] = useState(false)
  const [editingCat, setEditingCat] = useState<ExpenseCategory | null>(null)
  const [catName, setCatName] = useState('')
  const [catColor, setCatColor] = useState('#f59e0b')

  const load = () => {
    Promise.all([
      api.get<Supplier[]>('/suppliers'),
      api.get<ExpenseCategory[]>('/expense-categories')
    ]).then(([s, c]) => { setSuppliers(s.data); setCategories(c.data) })
  }

  useEffect(() => { load() }, [])

  const openNewSup = () => { setEditingSup(null); setSupName(''); setSupEmail(''); setSupPhone(''); setSupNotes(''); setShowSupForm(true) }
  const openEditSup = (s: Supplier) => { setEditingSup(s); setSupName(s.name); setSupEmail(s.contactEmail ?? ''); setSupPhone(s.phone ?? ''); setSupNotes(s.notes ?? ''); setShowSupForm(true) }

  const saveSup = async () => {
    if (!supName.trim()) return
    if (editingSup) {
      await api.put(`/suppliers/${editingSup.id}`, { name: supName, contactEmail: supEmail, phone: supPhone, notes: supNotes })
    } else {
      await api.post('/suppliers', { name: supName, contactEmail: supEmail, phone: supPhone, notes: supNotes })
    }
    setShowSupForm(false); setEditingSup(null); load()
  }

  const delSup = async (id: string) => {
    if (!confirm('למחוק ספק זה?')) return
    await api.delete(`/suppliers/${id}`); load()
  }

  const openNewCat = () => { setEditingCat(null); setCatName(''); setCatColor('#f59e0b'); setShowCatForm(true) }
  const openEditCat = (c: ExpenseCategory) => { setEditingCat(c); setCatName(c.name); setCatColor(c.color); setShowCatForm(true) }

  const saveCat = async () => {
    if (!catName.trim()) return
    if (editingCat) {
      await api.put(`/expense-categories/${editingCat.id}`, { name: catName, color: catColor })
    } else {
      await api.post('/expense-categories', { name: catName, color: catColor })
    }
    setShowCatForm(false); setEditingCat(null); load()
  }

  const delCat = async (id: string) => {
    if (!confirm('למחוק קטגוריה זו?')) return
    await api.delete(`/expense-categories/${id}`); load()
  }

  return (
    <div dir="rtl" className="space-y-8">
      {/* Suppliers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">ספקים</h2>
          <button onClick={openNewSup} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700">
            <Plus size={14} /> ספק חדש
          </button>
        </div>

        {showSupForm && (
          <div className="bg-white border border-indigo-200 rounded-xl p-5 space-y-4">
            <h3 className="font-medium text-slate-800">{editingSup ? 'עריכת ספק' : 'ספק חדש'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">שם *</label>
                <input value={supName} onChange={e => setSupName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">אימייל</label>
                <input value={supEmail} onChange={e => setSupEmail(e.target.value)} dir="ltr"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">טלפון</label>
                <input value={supPhone} onChange={e => setSupPhone(e.target.value)} dir="ltr"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">הערות</label>
                <input value={supNotes} onChange={e => setSupNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={saveSup} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">שמור</button>
              <button onClick={() => setShowSupForm(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-200">ביטול</button>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {suppliers.length === 0 ? (
            <p className="text-slate-400 text-sm p-6">אין ספקים עדיין.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">שם</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">טלפון</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">אימייל</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">הוצאות</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                    <td className="px-4 py-3 text-slate-500" dir="ltr">{s.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500" dir="ltr">{s.contactEmail ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{s._count?.expenses ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditSup(s)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => delSup(s.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

      {/* Categories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">קטגוריות הוצאות</h2>
          <button onClick={openNewCat} className="flex items-center gap-2 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-amber-600">
            <Plus size={14} /> קטגוריה חדשה
          </button>
        </div>

        {showCatForm && (
          <div className="bg-white border border-amber-200 rounded-xl p-5 space-y-4">
            <h3 className="font-medium text-slate-800">{editingCat ? 'עריכת קטגוריה' : 'קטגוריה חדשה'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">שם *</label>
                <input value={catName} onChange={e => setCatName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">צבע</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={catColor} onChange={e => setCatColor(e.target.value)}
                    className="h-9 w-14 border border-slate-300 rounded-lg p-0.5 cursor-pointer" />
                  <span className="text-xs text-slate-500">{catColor}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={saveCat} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600">שמור</button>
              <button onClick={() => setShowCatForm(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-200">ביטול</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categories.length === 0 ? (
            <p className="text-slate-400 text-sm col-span-4">אין קטגוריות עדיין.</p>
          ) : (
            categories.map(c => (
              <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ background: c.color }} />
                  <span className="text-sm font-medium text-slate-800">{c.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditCat(c)} className="p-1 text-slate-400 hover:text-indigo-600 rounded">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => delCat(c.id)} className="p-1 text-slate-400 hover:text-red-600 rounded">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
