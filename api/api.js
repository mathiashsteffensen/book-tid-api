const express = require('express')

const {errorHandler} = require('../middleware')

const apiRouter = express.Router()

// Importing APIs
const adminRouter = require('./admin')
const clientRouter = require('./client')
const sysadminRouter = require('./sysadmin')

apiRouter.use('/admin', adminRouter)
apiRouter.use('/client', clientRouter)
apiRouter.use('/sysadmin', sysadminRouter)

apiRouter.use('*', errorHandler)

module.exports = apiRouter