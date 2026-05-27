import express from "express"

const apiRouter = express.Router()

// Importing APIs
import { adminRouter } from "api/admin/routes"
import clientRouter from "api/client"
import sysadminRouter from "api/sysadmin"

import feedbackRouter from "./feedback"

apiRouter.use("/admin", adminRouter)
apiRouter.use("/client", clientRouter)
apiRouter.use("/sysadmin", sysadminRouter)
apiRouter.use("/feedback", feedbackRouter)

apiRouter.use((_, res, next) => {
  try {
    next()
  } catch (err) {
    if (res.headersSent) {
      console.log("Error occurred but headers were already set -", err)
      return
    }

    res.status(500)
    res.json({ error: err.message })
  }
})

export default apiRouter
