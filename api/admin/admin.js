// Importing express
const express = require('express')
const cors = require('cors')

// Importing routes for the admin API
const authRouter = require('./auth')
const calendarRouter = require('./calendar')
const customerRouter = require('./customer')
const serviceRouter = require('./service')
const appointmentRouter = require('./appointment')
const settingsRouter = require('./settings')
const payRouter = require('./stripe/pay')
const productsRouter = require('./stripe/products')

// Attaching sub-routes to main admin router and enabling CORS
const adminRouter = express.Router()

const whitelist = ['https://admin.booktid.net', 'http://localhost:3000']
var corsOptionsDelegate = function (req, callback) {
  const corsOptions = {
      methods: ["GET", "PUT", "POST", "DELETE", "HEAD", "PATCH"],
      allowedHeaders: ["Content-Type"],
  };
  if (whitelist.indexOf(req.header('Origin')) !== -1) {
      corsOptions.origin = true
  } else {
      corsOptions.origin = false
  }
  callback(null, corsOptions);
}

adminRouter.use(cors(corsOptionsDelegate))

adminRouter.use('/auth', authRouter)
adminRouter.use('/customer', customerRouter)
adminRouter.use('/service', serviceRouter)
adminRouter.use('/calendar', calendarRouter)
adminRouter.use('/appointment', appointmentRouter)
adminRouter.use('/settings', settingsRouter)
adminRouter.use('/pay', payRouter)
adminRouter.use('/products', productsRouter)

module.exports = adminRouter