import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Tags, CreditCard, BarChart2, LogOut, TrendingDown, Receipt, Lightbulb } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const incomeNav = [
  { to: '/', icon: LayoutDashboard, label: 'דשבורד' },
  { to: '/topics', icon: Tags, label: 'נושאים' },
  { to: '/payments', icon: CreditCard, label: 'תשלומים' },
  { to: '/reports', icon: BarChart2, label: 'דוחות' },
]

const expenseNav = [
  { to: '/expenses/dashboard', icon: TrendingDown, label: 'דשבורד' },
  { to: '/expense-topics', icon: Tags, label: 'נושאים' },
  { to: '/expenses', icon: Receipt, label: 'תשלומים' },
  { to: '/expense-reports', icon: BarChart2, label: 'דוחות' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navLink = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/' || to === '/expenses/dashboard' || to === '/expenses'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-white/15 text-white shadow-sm'
            : 'text-slate-400 hover:text-white hover:bg-white/10'
        }`
      }
    >
      <Icon size={16} className="flex-shrink-0" />
      {label}
    </NavLink>
  )

  return (
    <div className="flex h-screen" dir="rtl">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col" style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)' }}>
        {/* Logo */}
        <div className="px-5 py-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div>
              <div className="text-white font-bold text-base leading-none">PayTrack</div>
              <div className="text-indigo-300 text-xs mt-0.5 truncate max-w-[120px]">{user?.name}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
          <div className="text-indigo-400 text-xs font-semibold px-3 py-2 tracking-wider">הכנסות</div>
          {incomeNav.map(navLink)}

          <div className="mx-3 my-3 border-t border-white/10" />
          <div className="text-indigo-400 text-xs font-semibold px-3 py-2 tracking-wider">הוצאות</div>
          {expenseNav.map(navLink)}

          <div className="mx-3 my-3 border-t border-white/10" />
          <div className="text-indigo-400 text-xs font-semibold px-3 py-2 tracking-wider">טיפים לעסק ביתי</div>
          <NavLink
            to="/tips"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive ? 'bg-white/15 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <Lightbulb size={16} className="flex-shrink-0" />
            פתיחת עסק ביתי
          </NavLink>
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-150"
          >
            <LogOut size={16} />
            התנתק
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-slate-50">
        <div className="p-6 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
