import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import api from '../api'
import type { SupplierWithBalance, Expense } from '../types'

const fmt = (n: number) => `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export default function ExpensesListPage() {
  const [suppliers, setSuppliers] = useState<SupplierWithBalance[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  // Add expense
  const [showExpForm, setShowExpForm] = useState<string | null>(null)
  const [expAmount, setExpAmount] = useState('')
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10))
  const [expDesc, setExpDesc] = useState('')

  // Edit expense
  const [editingExpId, setEditingExpId] = useState<string | null>(null)
  const [editExpAmount, setEditExpAmount] = useState('')
  const [editExpDate, setEditExpDate] = useState('')
  const [editExpDesc, setEditExpDesc] = useState('')

  // Edit supplier
  const [editingSupId, setEditingSupId] = useState<string | null>(null)
  const [editSupName, setEditSupName] = useState('')
  const [editSupEmail, setEditSupEmail] = useState('')
  const [editSupPhone, setEditSupPhone] = useState('')
  const [editSupNotes, setEditSupNotes] = useState('')

  const load = () => {
    api.get<SupplierWithBalance[]>('/suppliers').then(r => {
      setSuppliers(r.data.filter(s => s.expenses.length > 0))
    })
  }

  useEffect(() => { load() }, [])

  const openExpForm = (supplierId: string) => {
    setShowExpForm(supplierId); setEditingExpId(null)
    setExpAmount(''); setExpDate(new Date().toISOString().slice(0, 10)); setExpDesc('')
  }

  const addExpense = async (supplierId: string) => {
    if (!expAmount) return
    await api.post('/expenses', { supplierId, amount: Number(expAmount), date: expDate, description: expDesc })
    setShowExpForm(null); load()
  }

  const openEditExp = (exp: Expense) => {
    setEditingExpId(exp.id); setShowExpForm(null)
    setEditExpAmount(String(Number(exp.amount)))
    setEditExpDate(new Date(exp.date).toISOString().slice(0, 10))
    setEditExpDesc(exp.description ?? '')
  }

  const saveEditExp = async () => {
    if (!editingExpId || !editExpAmount) return
    await api.put(`/expenses/${editingExpId}`, { amount: Number(editExpAmount), date: editExpDate, description: editExpDesc })
    setEditingExpId(null); load()
  }

  const openEditSup = (sup: SupplierWithBalance, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingSupId(sup.id)
    setEditSupName(sup.name)
    setEditSupEmail(sup.contactEmail ?? '')
    setEditSupPhone(sup.phone ?? '')
    setEditSupNotes(sup.notes ?? '')
    setExpanded(sup.id)
  }

  const saveEditSup = async () => {
    if (!editingSupId || !editSupName.trim()) return
    await api.put(`/suppliers/${editingSupId}`, { name: editSupName, contactEmail: editSupEmail, phone: editSupPhone, notes: editSupNotes })
    setEditingSupId(null); load()
  }

  const deleteExpense = async (expId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('למחוק הוצאה זו?')) return
    await api.delete(`/expenses/${expId}`); load()
  }

  return (
    <div dir="rtl" className="space-y-5">
      <h2 className="text-xl font-semibold text-slate-900">תשלומים</h2>

      {suppliers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
          אין הוצאות עדיין.
        </div>
      ) : (
        <div className="space-y-2">
          {suppliers.map(supplier => {
            const isExpanded = expanded === supplier.id
            const balancePositive = supplier.balance <= 0

            return (
              <div key={supplier.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {/* Supplier header */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 select-none"
                  onClick={() => setExpanded(isExpanded ? null : supplier.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm flex-shrink-0">
                      {supplier.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{supplier.name}</div>
                      {supplier.phone && <div className="text-xs text-slate-400" dir="ltr">{supplier.phone}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-6">
                      <div className="text-left">
                        <div className="text-sm font-semibold text-slate-700">{fmt(supplier.totalInvoiced)}</div>
                        <div className="text-xs text-slate-400">חשבוניות</div>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-emerald-700">{fmt(supplier.totalPaid)}</div>
                        <div className="text-xs text-slate-400">שולם</div>
                      </div>
                      <div className="text-left">
                        <div className={`text-sm font-semibold ${balancePositive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {balancePositive ? `זיכוי ${fmt(Math.abs(supplier.balance))}` : fmt(supplier.balance)}
                        </div>
                        <div className="text-xs text-slate-400">{balancePositive ? 'זיכוי' : 'חוב'}</div>
                      </div>
                    </div>
                    <button
                      onClick={e => openEditSup(supplier, e)}
                      className="p-1.5 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <span className="text-slate-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 py-3 space-y-3">
                    {/* Supplier edit form */}
                    {editingSupId === supplier.id && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3">
                        <p className="text-xs font-medium text-amber-700">עריכת פרטי ספק</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">שם *</label>
                            <input value={editSupName} onChange={e => setEditSupName(e.target.value)}
                              className="w-full border border-amber-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">אימייל</label>
                            <input value={editSupEmail} onChange={e => setEditSupEmail(e.target.value)} dir="ltr"
                              className="w-full border border-amber-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">טלפון</label>
                            <input value={editSupPhone} onChange={e => setEditSupPhone(e.target.value)} dir="ltr"
                              className="w-full border border-amber-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">הערות</label>
                            <input value={editSupNotes} onChange={e => setEditSupNotes(e.target.value)}
                              className="w-full border border-amber-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={saveEditSup} className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-amber-600">
                            <Check size={12} /> שמור
                          </button>
                          <button onClick={() => setEditingSupId(null)} className="flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs hover:bg-slate-200">
                            <X size={12} /> ביטול
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        {supplier.expenses.length} הוצאות · סה&quot;כ {fmt(supplier.totalInvoiced)}
                      </span>
                      <button
                        onClick={() => openExpForm(showExpForm === supplier.id ? '' : supplier.id)}
                        className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-amber-600"
                      >
                        <Plus size={12} /> הוסף חשבונית
                      </button>
                    </div>

                    {showExpForm === supplier.id && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">סכום *</label>
                            <input type="number" min="0" step="0.01" value={expAmount} onChange={e => setExpAmount(e.target.value)}
                              dir="ltr" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white" placeholder="0" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">תאריך *</label>
                            <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">תיאור</label>
                            <input value={expDesc} onChange={e => setExpDesc(e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => addExpense(supplier.id)} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600">שמור</button>
                          <button onClick={() => setShowExpForm(null)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-200">ביטול</button>
                        </div>
                      </div>
                    )}

                    <div className="divide-y divide-slate-50">
                      {supplier.expenses.map(exp => (
                        <div key={exp.id}>
                          {editingExpId === exp.id ? (
                            <div className="py-2 space-y-2">
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-xs text-slate-500 mb-1">סכום *</label>
                                  <input type="number" min="0" step="0.01" value={editExpAmount} onChange={e => setEditExpAmount(e.target.value)}
                                    dir="ltr" className="w-full border border-amber-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white" />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-500 mb-1">תאריך *</label>
                                  <input type="date" value={editExpDate} onChange={e => setEditExpDate(e.target.value)}
                                    className="w-full border border-amber-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white" />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-500 mb-1">תיאור</label>
                                  <input value={editExpDesc} onChange={e => setEditExpDesc(e.target.value)}
                                    className="w-full border border-amber-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white" />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={saveEditExp} className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-amber-600">
                                  <Check size={12} /> שמור
                                </button>
                                <button onClick={() => setEditingExpId(null)} className="flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs hover:bg-slate-200">
                                  <X size={12} /> ביטול
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between py-2">
                              <div>
                                <div className="text-xs text-slate-400">{new Date(exp.date).toLocaleDateString('he-IL')}</div>
                                {exp.description && <div className="text-xs text-slate-500 mt-0.5">{exp.description}</div>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-700">{fmt(Number(exp.amount))}</span>
                                <button onClick={e => { e.stopPropagation(); openEditExp(exp as unknown as Expense) }} className="p-1 text-slate-300 hover:text-amber-500 rounded transition-colors">
                                  <Pencil size={13} />
                                </button>
                                <button onClick={e => deleteExpense(exp.id, e)} className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          )}
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
