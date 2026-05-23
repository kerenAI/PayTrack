import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import 'dotenv/config'

import authRouter from './routes/auth'
import topicsRouter from './routes/topics'
import clientsRouter from './routes/clients'
import paymentsRouter from './routes/payments'
import prepaymentsRouter from './routes/prepayments'
import dashboardRouter from './routes/dashboard'
import reportsRouter from './routes/reports'

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
app.use('/api/dashboard', dashboardRouter)
app.use('/api/reports', reportsRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
