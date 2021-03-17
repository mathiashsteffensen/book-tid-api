// Importing express
import express from 'express'
import cors, { CorsOptions, CorsOptionsDelegate } from 'cors'
import rateLimit from 'express-rate-limit'

// Importing routes for the admin API
import authRouter from './auth'
import calendarRouter from './calendar'
import customerRouter from './customer'
import serviceRouter from './service'
import appointmentRouter from './appointment'
import settingsRouter from './settings'
import appStoreRouter from './appStore'
import payRouter from './stripe/pay'
import productsRouter from './stripe/products'

// Attaching sub-routes to main admin router and enabling CORS
const adminRouter = express.Router()

const whitelist = ['https://admin.booktid.net', 'http://localhost:3000']
var corsOptionsDelegate: CorsOptionsDelegate = function (req, callback) {
  const corsOptions: CorsOptions = {
      methods: ["GET", "PUT", "POST", "DELETE", "HEAD", "PATCH"],
      allowedHeaders: ["Content-Type", "content-type"],
  };

  // @ts-ignore
  if (whitelist.indexOf(req.header('Origin') || "") !== -1) {
      corsOptions.origin = true
  } else {
      corsOptions.origin = false
  }
  callback(null, corsOptions);
}

adminRouter.use(cors(corsOptionsDelegate))

// Rate limiting the API to deter DDoS attacks
const adminAPILimiter = rateLimit({
    windowMs: 1000,
    max: 100
})

adminRouter.use('/auth', authRouter)
adminRouter.use('/customer', customerRouter)
adminRouter.use('/service', serviceRouter)
adminRouter.use('/calendar', calendarRouter)
adminRouter.use('/appointment', appointmentRouter)
adminRouter.use('/settings', settingsRouter)
adminRouter.use('/app-store', appStoreRouter)
adminRouter.use('/pay', payRouter)
adminRouter.use('/products', productsRouter)

adminRouter.use(adminAPILimiter)

export default adminRouter