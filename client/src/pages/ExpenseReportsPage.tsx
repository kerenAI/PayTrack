import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import api from '../api'
import type { Expense, Supplier, ExpenseCategory } from '../types'

const fmt = (n: number) => `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export default function ExpenseReportsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [searched, setSearched] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [categoryId, setCategoryId] = useState('')

  useEffect(() => {
    api.get<Supplier[]>('/suppliers').then(r => setSuppliers(r.data))
    api.get<ExpenseCategory[]>('/expense-categories').then(r => setCategories(r.data))
  }, [])

  const search = () => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (supplierId) params.set('supplierId', supplierId)
    if (categoryId) params.set('categoryId', categoryId)
    api.get<Expense[]>(`/expenses?${params}`).then(r => { setExpenses(r.data); setSearched(true) })
  }

  const downloadCsv = () => {
    const headers = ['תאריך', 'ספק', 'נושא', 'תיאור', 'סכום']
    const rows = expenses.map(e => [
      new Date(e.date).toLocaleDateString('he-IL'),
      e.supplier?.name ?? '',
      e.category?.name ?? '',
      e.description ?? '',
      Number(e.amount).toFixed(2)
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'דוח-הוצאות.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">דוחות הוצאות</h2>
        {expenses.length > 0 && (
          <button onClick={downloadCsv} className="flex items-center gap-2 border border-slate-200 bg-white text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-50">
            <Download size={15} /> ייצוא CSV
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">מתאריך</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">עד תאריך</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">ספק</label>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">הכל</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">נושא</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">הכל</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <button onClick={search} className="mt-4 bg-amber-500 text-white px-5 py-2 rounded-lg text-sm hover:bg-amber-600">חפש</button>
      </div>

      {searched && expenses.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-slate-900">{fmt(total)}</div>
          <div className="text-xs text-slate-500 mt-0.5">סך הוצאות · {expenses.length} רשומות</div>
        </div>
      )}

      {searched && expenses.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-slate-600">תאריך</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">ספק</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">נושא</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">תיאור</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">סכום</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{new Date(e.date).toLocaleDateString('he-IL')}</td>
                  <td className="px-4 py-3 text-slate-700">{e.supplier?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {e.category ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.category.color }} />
                        {e.category.name}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{e.description || '—'}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{fmt(Number(e.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {searched && expenses.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
          לא נמצאו תוצאות.
        </div>
      )}
    </div>
  )
}
