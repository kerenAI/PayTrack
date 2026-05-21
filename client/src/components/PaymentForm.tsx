import { useState, FormEvent } from 'react'
import api from '../api'
import type { Topic } from '../types'

interface Props {
  clientId: string
  topics: Topic[]
  defaultTopicId?: string
  onSaved: () => void
  onCancel: () => void
}

export default function PaymentForm({ clientId, topics, defaultTopicId, onSaved, onCancel }: Props) {
  const [topicId, setTopicId] = useState(defaultTopicId ?? topics[0]?.id ?? '')
  const [totalAmount, setTotalAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [error, setError] = useState('')

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!topicId || !totalAmount) { setError('נושא וסכום הם שדות חובה'); return }
    try {
      await api.post('/payments', { clientId, topicId, totalAmount: Number(totalAmount), dueDate: dueDate || undefined, description, isRecurring })
      onSaved()
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'שגיאה בשמירה')
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <h3 className="font-medium text-slate-800">תשלום חדש</h3>
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
      <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">נושא *</label>
          <select value={topicId} onChange={e => setTopicId(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">סכום *</label>
          <input type="number" min="0" step="0.01" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0.00" dir="ltr" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">תאריך יעד</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">תיאור</label>
          <input value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="sm:col-span-2 flex items-center gap-2">
          <input type="checkbox" id="recurring" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="rounded border-slate-300" />
          <label htmlFor="recurring" className="text-sm text-slate-600">תשלום חוזר</label>
        </div>
        <div className="sm:col-span-2 flex gap-2">
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">שמור</button>
          <button type="button" onClick={onCancel} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-200">ביטול</button>
        </div>
      </form>
    </div>
  )
}
