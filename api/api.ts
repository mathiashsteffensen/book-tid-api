import express from 'express'

import { errorHandler } from '../middleware'

const apiRouter = express.Router()

// Importing APIs
import adminRouter from './admin'
import clientRouter from './client'
import sysadminRouter from './sysadmin'

apiRouter.use('/admin', adminRouter)
apiRouter.use('/client', clientRouter)
apiRouter.use('/sysadmin', sysadminRouter)

apiRouter.use('*', errorHandler)

export default apiRouter