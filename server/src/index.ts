import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import 'dotenv/config'

import authRouter from './routes/auth'
import topicsRouter from './routes/topics'
import clientsRouter from './routes/clients'
import paymentsRouter from './routes/payments'
import prepaymentsRouter from './routes/prepayments'
import clientPaymentsRouter from './routes/clientPayments'
import dashboardRouter from './routes/dashboard'
import reportsRouter from './routes/reports'
import suppliersRouter from './routes/suppliers'
import expenseCategoriesRouter from './routes/expenseCategories'
import expensesRouter from './routes/expenses'
import supplierPaymentsRouter from './routes/supplierPayments'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: /^http:\/\/localhost:\d+$/, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRouter)
app.use('/api/topics', topicsRouter)
app.use('/api/clients', clientsRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/prepayments', prepaymentsRouter)
app.use('/api/client-payments', clientPaymentsRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/suppliers', suppliersRouter)
app.use('/api/expense-categories', expenseCategoriesRouter)
app.use('/api/expenses', expensesRouter)
app.use('/api/supplier-payments', supplierPaymentsRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
