import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingDown, Receipt, ChevronLeft } from 'lucide-react'
import api from '../api'
import type { ExpenseDashboard, SupplierBalanceSummary } from '../types'

const fmt = (n: number) => `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']
const MONTHS_SHORT = ['ינו','פבר','מרץ','אפר','מאי','יונ','יול','אוג','ספט','אוק','נוב','דצמ']

function SupplierBadge({ s }: { s: SupplierBalanceSummary }) {
  if (s.totalInvoiced === 0)
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200">אין חשבוניות</span>
  if (s.balance <= 0)
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">זיכוי {fmt(Math.abs(s.balance))}</span>
  if (s.totalPaid === 0)
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200">טרם שולם</span>
  if (s.balance < s.totalInvoiced)
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">חוב חלקי {fmt(s.balance)}</span>
  return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 ring-1 ring-red-200">חוב {fmt(s.balance)}</span>
}

export default function ExpenseDashboardPage() {
  const [data, setData] = useState<ExpenseDashboard | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get<ExpenseDashboard>('/expenses/dashboard').then(r => setData(r.data))
  }, [])

  if (!data) return <div className="text-slate-400 text-sm" dir="rtl">טוען...</div>

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">דשבורד הוצאות</h2>
        <p className="text-sm text-slate-400 mt-0.5">סקירה כללית של ההוצאות</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-red-500 to-rose-600 rounded-r-full" />
          <div className="inline-flex p-2.5 rounded-xl bg-red-50 text-red-600 mb-3">
            <TrendingDown size={18} />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{fmt(data.totalThisMonth)}</div>
          <div className="text-sm text-slate-400 mt-0.5">הוצאות החודש</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-orange-500 rounded-r-full" />
          <div className="inline-flex p-2.5 rounded-xl bg-amber-50 text-amber-600 mb-3">
            <Receipt size={18} />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{data.countThisMonth}</div>
          <div className="text-sm text-slate-400 mt-0.5">עסקאות החודש</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-slate-400 to-slate-500 rounded-r-full" />
          <div className="inline-flex p-2.5 rounded-xl bg-slate-100 text-slate-600 mb-3">
            <TrendingDown size={18} />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{fmt(data.totalAllTime)}</div>
          <div className="text-sm text-slate-400 mt-0.5">סה"כ כל הזמן</div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-slate-800">הוצאות חודשיות</h3>
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
              cursor={{ fill: '#fef2f2' }}
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 13 }}
              formatter={(v) => [fmt(Number(v)), 'הוצאות']}
              labelFormatter={key => {
                const [y, m] = String(key).split('-')
                return `${MONTHS[Number(m) - 1]} ${y}`
              }}
            />
            <Bar dataKey="total" fill="url(#expenseGradient)" radius={[6, 6, 0, 0]} />
            <defs>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#fca5a5" stopOpacity={0.7} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Suppliers */}
      {data.recentSuppliers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-800">ספקים אחרונים</h3>
              <p className="text-xs text-slate-400 mt-0.5">סטטוס מאזן</p>
            </div>
            <button
              onClick={() => navigate('/expenses')}
              className="text-xs text-amber-600 font-medium hover:text-amber-700 flex items-center gap-1"
            >
              כל התשלומים <ChevronLeft size={14} />
            </button>
          </div>
          <div className="space-y-1">
            {data.recentSuppliers.map(s => (
              <div
                key={s.supplierId}
                className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{s.name}</div>
                    <div className="text-xs text-slate-400">{fmt(s.totalInvoiced)} חשבוניות · {fmt(s.totalPaid)} שולם</div>
                  </div>
                </div>
                <SupplierBadge s={s} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
