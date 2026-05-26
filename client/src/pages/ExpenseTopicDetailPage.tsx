import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, Plus, Trash2, ChevronDown, ChevronUp, Pencil, Check, X } from 'lucide-react'
import api from '../api'
import type { ExpenseCategoryWithSuppliers, SupplierWithBalance, Expense, SupplierPayment } from '../types'

const fmt = (n: number) => `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export default function ExpenseTopicDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [category, setCategory] = useState<ExpenseCategoryWithSuppliers | null>(null)
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null)

  // Add supplier
  const [showSupForm, setShowSupForm] = useState(false)
  const [supName, setSupName] = useState('')
  const [supEmail, setSupEmail] = useState('')
  const [supPhone, setSupPhone] = useState('')

  // Add expense
  const [showExpenseForm, setShowExpenseForm] = useState<string | null>(null)
  const [expAmount, setExpAmount] = useState('')
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10))
  const [expDesc, setExpDesc] = useState('')

  // Add supplier payment
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))
  const [payNotes, setPayNotes] = useState('')

  // Edit supplier
  const [editingSupId, setEditingSupId] = useState<string | null>(null)
  const [editSupName, setEditSupName] = useState('')
  const [editSupEmail, setEditSupEmail] = useState('')
  const [editSupPhone, setEditSupPhone] = useState('')
  const [editSupNotes, setEditSupNotes] = useState('')

  // Edit expense
  const [editingExpId, setEditingExpId] = useState<string | null>(null)
  const [editExpAmount, setEditExpAmount] = useState('')
  const [editExpDate, setEditExpDate] = useState('')
  const [editExpDesc, setEditExpDesc] = useState('')

  // Edit supplier payment
  const [editingPayId, setEditingPayId] = useState<string | null>(null)
  const [editPayAmount, setEditPayAmount] = useState('')
  const [editPayDate, setEditPayDate] = useState('')
  const [editPayNotes, setEditPayNotes] = useState('')

  const load = () => {
    api.get<ExpenseCategoryWithSuppliers>(`/expense-categories/${id}`).then(r => setCategory(r.data))
  }

  useEffect(() => { load() }, [id])

  const addSupplier = async () => {
    if (!supName.trim()) return
    await api.post('/suppliers', { name: supName, contactEmail: supEmail, phone: supPhone, categoryId: id })
    setShowSupForm(false); setSupName(''); setSupEmail(''); setSupPhone('')
    load()
  }

  const addExpense = async (supplierId: string) => {
    if (!expAmount) return
    await api.post('/expenses', { supplierId, categoryId: id, amount: Number(expAmount), date: expDate, description: expDesc })
    setShowExpenseForm(null); setExpAmount(''); setExpDesc('')
    load()
  }

  const addPayment = async (supplierId: string) => {
    if (!payAmount) return
    await api.post('/supplier-payments', { supplierId, amount: Number(payAmount), date: payDate, notes: payNotes })
    setShowPaymentForm(null); setPayAmount(''); setPayNotes('')
    load()
  }

  const openEditSup = (sup: SupplierWithBalance, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingSupId(sup.id)
    setEditSupName(sup.name)
    setEditSupEmail(sup.contactEmail ?? '')
    setEditSupPhone(sup.phone ?? '')
    setEditSupNotes(sup.notes ?? '')
    setExpandedSupplier(sup.id)
  }

  const saveEditSup = async () => {
    if (!editingSupId || !editSupName.trim()) return
    await api.put(`/suppliers/${editingSupId}`, { name: editSupName, contactEmail: editSupEmail, phone: editSupPhone, notes: editSupNotes })
    setEditingSupId(null); load()
  }

  const openEditExp = (e: Expense) => {
    setEditingExpId(e.id); setShowExpenseForm(null)
    setEditExpAmount(String(Number(e.amount)))
    setEditExpDate(new Date(e.date).toISOString().slice(0, 10))
    setEditExpDesc(e.description ?? '')
  }

  const saveEditExp = async () => {
    if (!editingExpId || !editExpAmount) return
    await api.put(`/expenses/${editingExpId}`, { amount: Number(editExpAmount), date: editExpDate, description: editExpDesc })
    setEditingExpId(null); load()
  }

  const openEditPay = (p: SupplierPayment) => {
    setEditingPayId(p.id); setShowPaymentForm(null)
    setEditPayAmount(String(Number(p.amount)))
    setEditPayDate(new Date(p.date).toISOString().slice(0, 10))
    setEditPayNotes(p.notes ?? '')
  }

  const saveEditPay = async () => {
    if (!editingPayId || !editPayAmount) return
    await api.put(`/supplier-payments/${editingPayId}`, { amount: Number(editPayAmount), date: editPayDate, notes: editPayNotes })
    setEditingPayId(null); load()
  }

  const deleteExpense = async (expId: string) => {
    if (!confirm('למחוק חשבונית זו?')) return
    await api.delete(`/expenses/${expId}`); load()
  }

  const deletePayment = async (payId: string) => {
    if (!confirm('למחוק תשלום זה?')) return
    await api.delete(`/supplier-payments/${payId}`); load()
  }

  if (!category) return <div className="text-slate-400 text-sm" dir="rtl">טוען...</div>

  const totalInvoiced = category.suppliers.reduce((s, sup) => s + sup.totalInvoiced, 0)
  const totalPaid = category.suppliers.reduce((s, sup) => s + sup.totalPaid, 0)
  const balance = totalInvoiced - totalPaid

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
          <ArrowRight size={16} />
        </button>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full" style={{ background: category.color }} />
          <h2 className="text-xl font-semibold text-slate-900">{category.name}</h2>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-slate-900">{fmt(totalInvoiced)}</div>
          <div className="text-xs text-slate-500 mt-0.5">סך חשבוניות</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-emerald-600">{fmt(totalPaid)}</div>
          <div className="text-xs text-slate-500 mt-0.5">סך שולם</div>
        </div>
        <div className={`border rounded-xl p-4 text-center ${balance <= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`text-xl font-bold ${balance <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {balance <= 0 ? `זיכוי ${fmt(Math.abs(balance))}` : fmt(balance)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{balance <= 0 ? 'זיכוי' : 'יתרת חוב'}</div>
        </div>
      </div>

      {/* Suppliers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-800">ספקים</h3>
          <button onClick={() => setShowSupForm(!showSupForm)}
            className="flex items-center gap-2 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-amber-600">
            <Plus size={14} /> ספק חדש
          </button>
        </div>

        {showSupForm && (
          <div className="bg-white border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">שם *</label>
                <input value={supName} onChange={e => setSupName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">אימייל</label>
                <input value={supEmail} onChange={e => setSupEmail(e.target.value)} dir="ltr"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">טלפון</label>
                <input value={supPhone} onChange={e => setSupPhone(e.target.value)} dir="ltr"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addSupplier} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600">שמור</button>
              <button onClick={() => setShowSupForm(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-200">ביטול</button>
            </div>
          </div>
        )}

        {category.suppliers.length === 0 ? (
          <p className="text-slate-400 text-sm">אין ספקים בנושא זה עדיין.</p>
        ) : (
          <div className="space-y-2">
            {category.suppliers.map((sup: SupplierWithBalance) => {
              const isOpen = expandedSupplier === sup.id
              const supBalance = sup.totalInvoiced - sup.totalPaid
              return (
                <div key={sup.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div
                    onClick={() => setExpandedSupplier(isOpen ? null : sup.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-900">{sup.name}</span>
                      {sup.phone && <span className="text-xs text-slate-400" dir="ltr">{sup.phone}</span>}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-slate-700">{fmt(sup.totalInvoiced)}</div>
                        <div className="text-xs text-slate-400">חשבוניות</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-emerald-600">{fmt(sup.totalPaid)}</div>
                        <div className="text-xs text-slate-400">שולם</div>
                      </div>
                      <div className={`text-right min-w-[56px] px-2 py-1 rounded-lg ${supBalance <= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        <div className="text-sm font-bold">{supBalance <= 0 ? `+${fmt(Math.abs(supBalance))}` : fmt(supBalance)}</div>
                        <div className="text-xs">{supBalance <= 0 ? 'זיכוי' : 'חוב'}</div>
                      </div>
                      <button
                        onClick={e => openEditSup(sup, e)}
                        className="p-1.5 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      {isOpen ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-slate-100 px-4 py-4 space-y-4 bg-slate-50">
                      {/* Supplier edit form */}
                      {editingSupId === sup.id && (
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
                      {/* Expenses */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-slate-700">חשבוניות</h4>
                          <button onClick={() => { setShowExpenseForm(sup.id); setShowPaymentForm(null); setExpAmount(''); setExpDesc(''); setExpDate(new Date().toISOString().slice(0, 10)); setEditingExpId(null) }}
                            className="flex items-center gap-1.5 bg-slate-700 text-white px-2.5 py-1 rounded-lg text-xs hover:bg-slate-800">
                            <Plus size={12} /> הוסף חשבונית
                          </button>
                        </div>
                        {showExpenseForm === sup.id && (
                          <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">סכום *</label>
                                <input type="number" min="0" value={expAmount} onChange={e => setExpAmount(e.target.value)} dir="ltr"
                                  className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">תאריך *</label>
                                <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)}
                                  className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">תיאור</label>
                                <input value={expDesc} onChange={e => setExpDesc(e.target.value)}
                                  className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => addExpense(sup.id)} className="bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-slate-800">שמור</button>
                              <button onClick={() => setShowExpenseForm(null)} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs hover:bg-slate-200">ביטול</button>
                            </div>
                          </div>
                        )}
                        {sup.expenses.length === 0 ? (
                          <p className="text-xs text-slate-400">אין חשבוניות.</p>
                        ) : (
                          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                  <th className="text-right px-3 py-2 font-medium text-slate-500">תאריך</th>
                                  <th className="text-right px-3 py-2 font-medium text-slate-500">תיאור</th>
                                  <th className="text-right px-3 py-2 font-medium text-slate-500">סכום</th>
                                  <th className="px-3 py-2" />
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {sup.expenses.map((e: Expense) => (
                                  <tr key={e.id}>
                                    {editingExpId === e.id ? (
                                      <td colSpan={4} className="px-3 py-2">
                                        <div className="grid grid-cols-3 gap-2 mb-2">
                                          <div>
                                            <label className="block text-xs text-slate-500 mb-1">סכום *</label>
                                            <input type="number" min="0" value={editExpAmount} onChange={ev => setEditExpAmount(ev.target.value)} dir="ltr"
                                              className="w-full border border-amber-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
                                          </div>
                                          <div>
                                            <label className="block text-xs text-slate-500 mb-1">תאריך *</label>
                                            <input type="date" value={editExpDate} onChange={ev => setEditExpDate(ev.target.value)}
                                              className="w-full border border-amber-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
                                          </div>
                                          <div>
                                            <label className="block text-xs text-slate-500 mb-1">תיאור</label>
                                            <input value={editExpDesc} onChange={ev => setEditExpDesc(ev.target.value)}
                                              className="w-full border border-amber-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <button onClick={saveEditExp} className="flex items-center gap-1 bg-amber-500 text-white px-2.5 py-1 rounded-lg text-xs hover:bg-amber-600">
                                            <Check size={11} /> שמור
                                          </button>
                                          <button onClick={() => setEditingExpId(null)} className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs hover:bg-slate-200">
                                            <X size={11} /> ביטול
                                          </button>
                                        </div>
                                      </td>
                                    ) : (
                                      <>
                                        <td className="px-3 py-2 text-slate-500">{new Date(e.date).toLocaleDateString('he-IL')}</td>
                                        <td className="px-3 py-2 text-slate-700">{e.description || '—'}</td>
                                        <td className="px-3 py-2 font-medium text-slate-900">{fmt(Number(e.amount))}</td>
                                        <td className="px-3 py-2">
                                          <div className="flex items-center gap-1">
                                            <button onClick={() => openEditExp(e)} className="p-1 text-slate-300 hover:text-amber-500 rounded">
                                              <Pencil size={12} />
                                            </button>
                                            <button onClick={() => deleteExpense(e.id)} className="p-1 text-slate-300 hover:text-red-500 rounded">
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Supplier Payments */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-slate-700">תשלומים לספק</h4>
                          <button onClick={() => { setShowPaymentForm(sup.id); setShowExpenseForm(null); setPayAmount(''); setPayNotes(''); setPayDate(new Date().toISOString().slice(0, 10)); setEditingPayId(null) }}
                            className="flex items-center gap-1.5 bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs hover:bg-emerald-700">
                            <Plus size={12} /> הוסף תשלום
                          </button>
                        </div>
                        {showPaymentForm === sup.id && (
                          <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">סכום *</label>
                                <input type="number" min="0" value={payAmount} onChange={e => setPayAmount(e.target.value)} dir="ltr"
                                  className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">תאריך *</label>
                                <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)}
                                  className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">הערות</label>
                                <input value={payNotes} onChange={e => setPayNotes(e.target.value)}
                                  className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => addPayment(sup.id)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-700">שמור</button>
                              <button onClick={() => setShowPaymentForm(null)} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs hover:bg-slate-200">ביטול</button>
                            </div>
                          </div>
                        )}
                        {sup.supplierPayments.length === 0 ? (
                          <p className="text-xs text-slate-400">אין תשלומים.</p>
                        ) : (
                          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                  <th className="text-right px-3 py-2 font-medium text-slate-500">תאריך</th>
                                  <th className="text-right px-3 py-2 font-medium text-slate-500">הערות</th>
                                  <th className="text-right px-3 py-2 font-medium text-slate-500">סכום</th>
                                  <th className="px-3 py-2" />
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {sup.supplierPayments.map((p: SupplierPayment) => (
                                  <tr key={p.id}>
                                    {editingPayId === p.id ? (
                                      <td colSpan={4} className="px-3 py-2">
                                        <div className="grid grid-cols-3 gap-2 mb-2">
                                          <div>
                                            <label className="block text-xs text-slate-500 mb-1">סכום *</label>
                                            <input type="number" min="0" value={editPayAmount} onChange={ev => setEditPayAmount(ev.target.value)} dir="ltr"
                                              className="w-full border border-emerald-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                                          </div>
                                          <div>
                                            <label className="block text-xs text-slate-500 mb-1">תאריך *</label>
                                            <input type="date" value={editPayDate} onChange={ev => setEditPayDate(ev.target.value)}
                                              className="w-full border border-emerald-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                                          </div>
                                          <div>
                                            <label className="block text-xs text-slate-500 mb-1">הערות</label>
                                            <input value={editPayNotes} onChange={ev => setEditPayNotes(ev.target.value)}
                                              className="w-full border border-emerald-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <button onClick={saveEditPay} className="flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs hover:bg-emerald-700">
                                            <Check size={11} /> שמור
                                          </button>
                                          <button onClick={() => setEditingPayId(null)} className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs hover:bg-slate-200">
                                            <X size={11} /> ביטול
                                          </button>
                                        </div>
                                      </td>
                                    ) : (
                                      <>
                                        <td className="px-3 py-2 text-slate-500">{new Date(p.date).toLocaleDateString('he-IL')}</td>
                                        <td className="px-3 py-2 text-slate-700">{p.notes || '—'}</td>
                                        <td className="px-3 py-2 font-medium text-emerald-700">{fmt(Number(p.amount))}</td>
                                        <td className="px-3 py-2">
                                          <div className="flex items-center gap-1">
                                            <button onClick={() => openEditPay(p)} className="p-1 text-slate-300 hover:text-emerald-500 rounded">
                                              <Pencil size={12} />
                                            </button>
                                            <button onClick={() => deletePayment(p.id)} className="p-1 text-slate-300 hover:text-red-500 rounded">
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
