import { useState, FormEvent } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (authLoading) return null
  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('אימייל או סיסמה שגויים')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Left panel — gradient */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-black text-2xl">P</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-3">PayTrack</h1>
          <p className="text-indigo-200 text-lg">ניהול הכנסות והוצאות חכם</p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-right">
            {['מעקב תשלומים', 'ניהול לקוחות', 'דוחות חודשיים', 'ניהול הוצאות'].map(f => (
              <div key={f} className="bg-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium">
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-black text-slate-900">PayTrack</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-8">
            <div className="mb-7">
              <h2 className="text-xl font-bold text-slate-900">ברוכה הבאה 👋</h2>
              <p className="text-slate-400 text-sm mt-1">התחברי לחשבונך</p>
            </div>

            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">אימייל</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">סיסמה</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50 transition-all mt-2"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
              >
                {loading ? 'מתחברת...' : 'התחברי'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              אין לך חשבון?{' '}
              <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                הירשמי
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
