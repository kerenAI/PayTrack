import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp, Clock, AlertTriangle, Wallet, ChevronLeft } from 'lucide-react'
import api from '../api'
import type { DashboardData, ClientBalanceSummary } from '../types'

const fmt = (n: number) => `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']
const MONTHS_SHORT = ['ינו','פבר','מרץ','אפר','מאי','יונ','יול','אוג','ספט','אוק','נוב','דצמ']

function BalanceBadge({ c }: { c: ClientBalanceSummary }) {
  if (c.totalOwed === 0)
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200">אין הזמנות</span>
  if (c.balance <= 0)
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">זיכוי {fmt(Math.abs(c.balance))}</span>
  if (c.totalPaid === 0)
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200">טרם שולם</span>
  if (c.balance < c.totalOwed)
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">חוב חלקי {fmt(c.balance)}</span>
  return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 ring-1 ring-red-200">חוב {fmt(c.balance)}</span>
}

const kpiCards = [
  {
    key: 'totalIncome',
    label: 'סך הכנסות',
    icon: TrendingUp,
    gradient: 'from-emerald-500 to-teal-600',
    light: 'bg-emerald-50 text-emerald-600',
  },
  {
    key: 'thisMonthIncome',
    label: 'החודש',
    icon: Wallet,
    gradient: 'from-indigo-500 to-violet-600',
    light: 'bg-indigo-50 text-indigo-600',
  },
  {
    key: 'pendingCount',
    label: 'ממתינים',
    icon: Clock,
    gradient: 'from-amber-400 to-orange-500',
    light: 'bg-amber-50 text-amber-600',
  },
  {
    key: 'overdueCount',
    label: 'באיחור',
    icon: AlertTriangle,
    gradient: 'from-rose-500 to-red-600',
    light: 'bg-rose-50 text-rose-600',
  },
]

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get<DashboardData>('/dashboard').then(r => setData(r.data))
  }, [])

  if (!data) return <div className="text-slate-400 text-sm">טוען...</div>

  const kpiValues: Record<string, string | number> = {
    totalIncome: fmt(data.totalIncome),
    thisMonthIncome: fmt(data.thisMonthIncome),
    pendingCount: data.pendingCount,
    overdueCount: data.overdueCount,
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">דשבורד</h2>
        <p className="text-sm text-slate-400 mt-0.5">סקירה כללית של הפעילות העסקית</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ key, label, icon: Icon, gradient, light }) => (
          <div key={key} className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-5 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${gradient} rounded-r-full`} />
            <div className={`inline-flex p-2.5 rounded-xl ${light} mb-3`}>
              <Icon size={18} />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">{kpiValues[key]}</div>
            <div className="text-sm text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Monthly Chart */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-slate-800">הכנסות חודשיות</h3>
            <p className="text-xs text-slate-400 mt-0.5">6 חודשים אחרונים</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.monthlyChart} margin={{ left: 0, right: 0, top: 4, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={key => {
                const [, m] = key.split('-')
                return MONTHS_SHORT[Number(m) - 1]
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `₪${v}`}
              width={60}
            />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 13 }}
              formatter={(v) => [fmt(Number(v)), 'הכנסות']}
              labelFormatter={key => {
                const [y, m] = String(key).split('-')
                return `${MONTHS[Number(m) - 1]} ${y}`
              }}
            />
            <Bar dataKey="total" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity={0.7} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Clients Balance */}
      {data.recentClients.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-800">לקוחות אחרונים</h3>
              <p className="text-xs text-slate-400 mt-0.5">סטטוס מאזן</p>
            </div>
            <button
              onClick={() => navigate('/payments')}
              className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1"
            >
              כל התשלומים <ChevronLeft size={14} />
            </button>
          </div>
          <div className="space-y-1">
            {data.recentClients.map((c: ClientBalanceSummary) => (
              <div
                key={c.id}
                onClick={() => navigate(`/clients/${c.id}`)}
                className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{c.name}</div>
                    <div className="text-xs text-slate-400">{fmt(c.totalOwed)} הזמנות · {fmt(c.totalPaid)} שולם</div>
                  </div>
                </div>
                <BalanceBadge c={c} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
