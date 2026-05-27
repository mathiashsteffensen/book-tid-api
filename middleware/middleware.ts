import { MyRequestHandler } from "types"
import {
  AdminClient,
  AdminCalendar
} from "db/models"
import { verifyToken } from "utils"

const verifyAdminKey: MyRequestHandler = async (req, res, next) => {
  const apiKey = req.headers["authorization"] as string || req.params.apiKey

  if (!apiKey) {
    res.status(401).send()
    return
  }

  try {
    const { email } = await verifyToken(apiKey)

    const user = await AdminClient.findOne({ email })
    if (!user) {
      res.status(401).send()
    } else {
      req.user = user
      next()
    }
  } catch (error) {
    console.log("Failed to verify admin auth token", error)
    res.status(401).send()
  }
}

// Verify calendar is specified
const verifyCalendarID: MyRequestHandler = async (req, res, next) => {
  const calendarID = req.params.calendarID
  if (calendarID) {
    const calendar = await AdminCalendar.findOne({
      adminEmail: req.user.email,calendarID: calendarID 
    })
    if (calendar) {
      req.calendar = calendar
      next()
    } else {
      res.status(400).json({ msg: "Kalenderen kunne ikke findes" })
    }
  } else {
    res.status(400).json({ msg: "Specificer venligst et kalendar ID" })
  }
}

// If calendar is optional
const fetchCalendar: MyRequestHandler = async (req, res, next) => {
  const calendarID = req.params.calendarID
  if (calendarID) {
    const calendar = await AdminCalendar.findOne({
      adminEmail: req.user.email,
      calendarID: calendarID
    })

    if (calendar) {
      req.calendar = calendar
    }
  }
  next()
}

const errorHandler = async (err, _, res) => {
  if (process.env.NODE_ENV === "development") {
    console.log(res.statusCode, err.msg)
  }

  if (res.statusCode === 404) {
    res.send({ msg: "didnt find that page, sorry bud", })
  } else {
    const status = res.statusCode === 200 ? 500 : res.statusCode
    res.status(status).json({
      msg: err.msg ? err.msg : "Der skete en fejl, prøv venligst igen", 
      stack: process.env.NODE_ENV === "development" ? err.stack : "pancake" 
    })
  }
}

const parseDomainPrefix: MyRequestHandler = async (req, _, next) => {
  const domainPrefix = req.params.domainPrefix

  req.client = await AdminClient.findOne({ "bookingSettings.domainPrefix": domainPrefix })
    .select("-cancelAtPeriodEnd -emailConfirmationKey -subscriptionID -subscriptionTypeName -paymentMethodLast4 -paymentMethodBrand -lastMonthPaid -nextMonthPay -password -status -subscriptionStart -subscriptionType -stripeCustomerID -changingEmail -bookingSettings.personalDataPolicy -currentPeriodEnd -invoiceStatus")
    .exec()

  next()
}

export {
  verifyAdminKey,
  errorHandler,
  verifyCalendarID,
  fetchCalendar,
  parseDomainPrefix
}
