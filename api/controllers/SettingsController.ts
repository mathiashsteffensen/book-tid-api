import uniqid from "uniqid"

import {
  MyRequestHandler,
  ServerError,
  UnauthorizedError,
  BadRequestError,
} from "types"
import { DateHelper } from "helpers/DateHelper"
import { sendNewEmailConfirmation } from "integrations/sendgrid"
import { AdminClient } from "db/models"

export default class SettingsController {
  static getBooking: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized")

    const client = await AdminClient.findOne({ email: req.user.email })
      .select("bookingSettings")
      .catch((err) => {
        throw new ServerError(err)
      })

    if (!client) throw new UnauthorizedError("Unauthorized")

    res.send(client.bookingSettings)
  }

  static updateBooking: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized")

    let client

    if (req.body.domainPrefix)
      client = await AdminClient.findOne({ "bookingSettings.domainPrefix": req.body.domainPrefix, })

    if (client && client.email !== req.user.email)
      throw new BadRequestError("Domæne navn er allerede i brug")

    client = await AdminClient.findOneAndUpdate(
      { email: req.user.email },
      { bookingSettings: req.body }
    )

    res.json(client?.bookingSettings)
  }

  static getProfile: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized")

    const client = await AdminClient.findOne({ email: req.user.email })
      .select(
        "name email phoneNumber currentPeriodEnd businessInfo subscriptionType lastMonthPaid nextMonthPay maxNumberOfCalendars"
      )
      .exec()

    res.json(client)
  }

  static updateProfile: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized")

    const {
      name,
      email,
      phoneNumber,
      businessInfo
    } = req.body
    
    if (email.toLowerCase() !== req.user.email) {

      const userWithNewEmail = await AdminClient.findOne( { email } ).exec() 
    
      if (userWithNewEmail) throw new BadRequestError("E-Mail allerede i brug")
    
      const emailConfirmationKey = uniqid("BOOKTID-")
    
      await AdminClient.findOneAndUpdate( { email: req.user.email }, {
        changingEmail: true,
        changingEmailTo: email,
        emailConfirmationKey
      } ).exec()
    
      await sendNewEmailConfirmation(req.user.email, {
        confirmLink: `https://admin.booktid.net/bekraeft-email?key=${emailConfirmationKey}`,
        dateSent: DateHelper.new().format("D. MMM YYYY"),
        newEmail: email
      }).catch((err) => 
        console.log(err))
    }
    
    await AdminClient.findOneAndUpdate( { email: req.user.email }, {
      name,
      phoneNumber,
      businessInfo
    } ).exec()
    
    res.send()
  }
}
