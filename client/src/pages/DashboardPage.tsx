import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Clock, AlertTriangle, Wallet } from 'lucide-react'
import api from '../api'
import type { DashboardData, Payment } from '../types'
import StatusBadge from '../components/StatusBadge'

const fmt = (n: number) => `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    api.get<DashboardData>('/dashboard').then(r => setData(r.data))
  }, [])

  if (!data) return <div className="text-slate-400 text-sm">טוען...</div>

  const cards = [
    { label: 'סך הכנסות', value: fmt(data.totalIncome), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'החודש', value: fmt(data.thisMonthIncome), icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'ממתינים', value: data.pendingCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'באיחור', value: data.overdueCount, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="space-y-6" dir="rtl">
      <h2 className="text-xl font-semibold text-slate-900">דשבורד</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">הכנסות חודשיות</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.monthlyChart}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₪${v}`} />
              <Tooltip formatter={(v) => fmt(Number(v))} />
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">תשלומים אחרונים</h3>
          <div className="space-y-2">
            {data.recentPayments.length === 0 && (
              <p className="text-slate-400 text-sm">אין תשלומים עדיין</p>
            )}
            {data.recentPayments.map((p: Payment) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <div className="text-sm font-medium text-slate-800">{p.client?.name}</div>
                  <div className="text-xs text-slate-400">{p.topic?.name}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">{fmt(Number(p.totalAmount))}</span>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
