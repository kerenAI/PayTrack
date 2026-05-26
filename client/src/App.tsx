import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TopicsPage from './pages/TopicsPage'
import TopicDetailPage from './pages/TopicDetailPage'
import ClientsPage from './pages/ClientsPage'
import ClientDetailPage from './pages/ClientDetailPage'
import PaymentsPage from './pages/PaymentsPage'
import PaymentDetailPage from './pages/PaymentDetailPage'
import ReportsPage from './pages/ReportsPage'
import ExpenseDashboardPage from './pages/ExpenseDashboardPage'
import SuppliersPage from './pages/SuppliersPage'
import ExpenseTopicsPage from './pages/ExpenseTopicsPage'
import ExpenseTopicDetailPage from './pages/ExpenseTopicDetailPage'
import ExpensesListPage from './pages/ExpensesListPage'
import ExpenseReportsPage from './pages/ExpenseReportsPage'
import TipsPage from './pages/TipsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/*" element={
        <PrivateRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/topics" element={<TopicsPage />} />
              <Route path="/topics/:id" element={<TopicDetailPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/clients/:id" element={<ClientDetailPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/payments/:id" element={<PaymentDetailPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/expenses/dashboard" element={<ExpenseDashboardPage />} />
              <Route path="/expenses" element={<ExpensesListPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/expense-topics" element={<ExpenseTopicsPage />} />
              <Route path="/expense-topics/:id" element={<ExpenseTopicDetailPage />} />
              <Route path="/expense-reports" element={<ExpenseReportsPage />} />
              <Route path="/tips" element={<TipsPage />} />
            </Routes>
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
