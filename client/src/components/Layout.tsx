import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Tags, CreditCard, BarChart2, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'דשבורד' },
  { to: '/topics', icon: Tags, label: 'נושאים' },
  { to: '/payments', icon: CreditCard, label: 'תשלומים' },
  { to: '/reports', icon: BarChart2, label: 'דוחות' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-slate-50" dir="rtl">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-l border-slate-200 flex flex-col">
        <div className="p-5 border-b border-slate-200">
          <h1 className="text-lg font-bold text-indigo-600">PayTrack</h1>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{user?.name}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <LogOut size={16} />
            התנתק
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
