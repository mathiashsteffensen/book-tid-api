import uniqid from "uniqid"

import {
  MyRequestHandler,
  ServerError,
  BadRequestError,
  UnauthorizedError,
} from "types"
import {
  encryptPassword, verifyPassword, createToken 
} from "utils"
import {
  AdminClient, Service, AdminCalendar, Appointment, Customer, TextReminderApp, ServiceCategory, ClientUiBrandingApp 
} from "db/models"

export default class AuthController{
  static signup: MyRequestHandler = async (req, res) => {
    const emailConfirmationKey = uniqid("BOOKTID-")

    // Encrypting password
    req.body.password = await encryptPassword(req.body.password)

    // Creates the user
    const user = await AdminClient.createDefault(req.body, emailConfirmationKey)

    const apiKey = createToken({
      email: user.email,
      firstName: user.name.firstName,
      stripeCustomerID: user.stripeCustomerID,
      subscriptionType: user.subscriptionType,
    })

    res.json({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      apiKey: apiKey,
    })
  }

  static confirmSignup: MyRequestHandler = async (req, res) => {
    const { emailConfirmationKey } = req.params

    const client = await AdminClient.findOne({ emailConfirmationKey, }).catch((err) => {
      throw new ServerError(err)
    })
    if (!client) {
      throw new BadRequestError(
        "Vi kunne ikke finde din registrerede bruger og bekræfte din e-mail, Kontakt venligst support på service@booktid.net"
      )
    }

    if (client.changingEmail && client.changingEmailTo) {
      // Client is changing email, generate a new key and resend confirmation

      const newEmailConfirmationKey = uniqid("BOOKTID-")

      await AdminClient.findOneAndUpdate(
        { emailConfirmationKey },
        {
          email: client.changingEmailTo,
          emailConfirmationKey: newEmailConfirmationKey,
          emailConfirmed: false,
          changingEmail: false,
        }
      )

      // Sends an email to the old to confirm the new email address
      AdminClient.sendSignUpConfirmationEmail(
        client.changingEmailTo,
        newEmailConfirmationKey
      )

      res.send(
        `Vi har bekræftet ændringen af din email til ${client.changingEmailTo} og har sendt en besked for at bekræfte din nye email`
      )
    } else {
      await AdminClient.findOneAndUpdate(
        { emailConfirmationKey },
        { emailConfirmed: true }
      )
      res.send("Din e-mail er bekræftet")
      res.status(200)
    }
  }

  static resendSignupConfirmation: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized")

    const emailConfirmationKey = uniqid("BOOKTID-")

    const client = await AdminClient.findOneAndUpdate(
      { email: req.user.email },
      { emailConfirmationKey }
    ).catch((err) => {
      throw new ServerError(err)
    })

    if (!client) throw new UnauthorizedError("Unauthorized")

    await AdminClient.sendSignUpConfirmationEmail(
      client.email,
      emailConfirmationKey
    ).catch((err: Error) => {
      console.log(err)
    })

    res.send()
  }

  static login: MyRequestHandler = async (req, res) => {
    const user = await AdminClient.findOne({ email: req.body.email }).catch(
      (err) => {
        throw new ServerError(err)
      }
    )
    if (!user) throw new BadRequestError("Forkert E-Mail eller kodeord")

    const valid = await verifyPassword(req.body.password, user.password)
    if (valid) {
      const token = createToken({
        email: user.email,
        firstName: user.name.firstName,
        stripeCustomerID: user.stripeCustomerID,
        subscriptionType: user.subscriptionType,
      })
      res.json({ apiKey: token })
    } else {
      throw new BadRequestError("Forkert E-Mail eller kodeord")
    }
  }

  static deleteAccount: MyRequestHandler = async (req, res) => {
    const services = await Service.find({ adminEmail: req.user.email }).exec()

    const categories = await ServiceCategory.find({ adminEmail: req.user.email }).exec()

    const calendars = await AdminCalendar.find({ adminEmail: req.user.email }).exec()
        
    const appointments = await Appointment.find({ adminEmail: req.user.email }).exec()

    const customers = await Customer.find({ adminEmail: req.user.email }).exec()

    const textReminderApps = await TextReminderApp.find({ adminEmail: req.user.email }).exec()

    const clientUiBrandingApps = await ClientUiBrandingApp.find({ adminEmail: req.user.email }).exec()

    console.log("Deleting " + services.length + " services")
    console.log("Deleting " + categories.length + " categories")
    console.log("Deleting " + calendars.length + " calendars")
    console.log("Deleting " + appointments.length + " appointments")
    console.log("Deleting " + customers.length + " customers")
    console.log("Deleting " + textReminderApps.length + " text reminder apps")

    const deletePromises = services.map(async (service) => {
      await Service.findByIdAndDelete(service._id)
    }).concat(categories.map(async (category) => {
      await ServiceCategory.findByIdAndDelete(category._id)
    })).concat(calendars.map(async (calendar) => {
      await AdminCalendar.findByIdAndDelete(calendar._id)
    })).concat(appointments.map(async (appointment) => {
      await Appointment.findByIdAndDelete(appointment._id)
    })).concat(customers.map(async (customer) => {
      await Customer.findByIdAndDelete(customer._id)
    })).concat(textReminderApps.map(async (textReminderApp) => {
      await TextReminderApp.findByIdAndDelete(textReminderApp._id)
    })).concat(clientUiBrandingApps.map(async (clientUiBrandingApp) => {
      await ClientUiBrandingApp.findByIdAndDelete(clientUiBrandingApp._id)
    }))

    await Promise.all(deletePromises)

    await AdminClient.findByIdAndDelete(req.user._id)

    res.send()
  }
}
