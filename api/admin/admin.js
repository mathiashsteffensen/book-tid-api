// Importing express
const express = require('express')

// Importing routes for the admin API
const authRouter = require('./auth')
const calendarRouter = require('./calendar')
const customerRouter = require('./customer')
const serviceRouter = require('./service')
const appointmentRouter = require('./appointment')
const settingsRouter = require('./settings')
const payRouter = require('../stripe/pay')

// Attaching sub-routes to main admin router
const adminRouter = express.Router()

adminRouter.use('/auth', authRouter)
adminRouter.use('/customer', customerRouter)
adminRouter.use('/service', serviceRouter)
adminRouter.use('/calendar', calendarRouter)
adminRouter.use('/appointment', appointmentRouter)
adminRouter.use('/settings', settingsRouter)
adminRouter.use('/pay', payRouter)

module.exports = adminRouter