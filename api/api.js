const express = require('express')
const cors = require('cors')

const {errorHandler} = require('../middleware')

const apiRouter = express.Router()

// Importing APIs
const adminRouter = require('./admin/admin')
const clientRouter = require('./client/index')

apiRouter.use('/admin', adminRouter)
apiRouter.use('/client', clientRouter)

apiRouter.use(errorHandler)

module.exports = apiRouter