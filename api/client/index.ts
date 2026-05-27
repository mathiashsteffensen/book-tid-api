import express from "express"
import rateLimit from "express-rate-limit"
import {
  body, validationResult 
} from "express-validator"
import cors from "cors"
import { DateHelper } from "helpers/DateHelper"

import { parseDomainPrefix } from "middleware"
import { sendTextReminder } from "integrations/sms"
import {
  AdminCalendar,
  Service,
  ServiceCategory,
  Appointment,
  Customer,
  AdminClient,
  TextReminderApp,
  ClientUiBrandingApp
} from "db/models"
import {
  BadRequestError, MyRequest
} from "types"
import {
  getOpeningHoursByDate,
  validateAppointment,
  generateCustomerCancelToken,
} from "utils"
import {
  sendConfirmationEmail,
  sendNewBookingEmail,
  sendClientCancelEmail,
} from "integrations/sendgrid"

const clientRouter = express.Router()

const bookAppointmentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // start blocking after 15 requests
  message:
        "Der er booket for mange tider fra denne IP-addresse, prøv venligst igen efter èn time, dette er en sikkerhedsforanstaltning",
})

const clientAPILimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, 
})

clientRouter.use(cors())

clientRouter.use(clientAPILimiter)

clientRouter.get(
  "/theme/:domainPrefix",
  parseDomainPrefix,
  async (req: MyRequest, res) => {
    if (req.client) {
      if (req.client.activatedApps.includes("clientUiBranding")) {
        const app = await ClientUiBrandingApp.findOne({
          adminEmail: req.client.email, activated: true 
        }).exec()
        res.json({
          theme: req.client, branding: app 
        })

      } else {
        res.json({
          theme: req.client, branding: false 
        })
      }
    } else {
      res.status(404)
      res.json({ msg: "client not found" })
    }
  }
)

clientRouter.get(
  "/available-times/:domainPrefix/:serviceID/:date",
  parseDomainPrefix,
  async (req: MyRequest, res) => {
    const {
      serviceID, date 
    } = req.params

    const adminEmail = req.client.email

    const service = await Service.findById(serviceID).exec()
    const timeTaken = service.minutesTaken + service.breakAfter

    const calendarQuery = (!service.allCalendars
      ? await Promise.all(
        service.elgibleCalendars.map(
          async (calendar) =>
            await AdminCalendar.findOne({
              adminEmail,
              _id: calendar.id,
            }).exec()
        )
      )
      : await AdminCalendar.find({ adminEmail }).exec()) as Array<AdminCalendar & { availableTimes: Array<unknown> }>

    const calendars = await Promise.all(
      calendarQuery
        .map(async (calendar) => {
          const openingHours = getOpeningHoursByDate(
            calendar.schedule,
            DateHelper.utc(date).add(12, "hours").toJSON()
          )

          const bookingSettings = req.client.bookingSettings
          if (openingHours.open) {
            const returnArray = []
            let startTime = DateHelper
              .utc(date)
              .add(12, "hours")
              .hour(openingHours.startOfWork.hour)
              .minute(openingHours.startOfWork.minute)
            let endTime = startTime.add(
              timeTaken,
              "minutes"
            )
            const closeTime = DateHelper
              .utc(date)
              .add(12, "hours")
              .hour(openingHours.endOfWork.hour)
              .minute(openingHours.endOfWork.minute)

            do {
              await validateAppointment(
                adminEmail,
                calendar,
                bookingSettings,
                startTime.toJSON(),
                endTime.toJSON()
              )
                .then(() => {
                  returnArray.push({
                    startTime,
                    endTime, 
                  })
                  startTime = endTime
                  endTime = startTime.add(
                    timeTaken,
                    "minute"
                  )
                })
                .catch(() => {
                  startTime = endTime
                  endTime = startTime.add(
                    timeTaken,
                    "minute"
                  )
                })
            } while (
              endTime.isSameOrBefore(closeTime, "minute")
            )

            calendar.availableTimes = returnArray

            return calendar
          } else return null
        })
    )

    res.json(
      calendars
        .filter((calendar) =>
          calendar !== null)
        .map((calendar) => {
          return {
            calendar,
            availableTimes: calendar.availableTimes,
          }
        })
    )
  }
)

clientRouter.get(
  "/services-and-categories/:domainPrefix",
  parseDomainPrefix,
  async (req: MyRequest, res) => {
    const services = await Service.find({ adminEmail: req.client.email })
      .select("-adminEmail")
      .exec()
    const categories = await ServiceCategory.find({ adminEmail: req.client.email, })
      .select("-adminEmail")
      .exec()

    res.json({
      services, categories 
    })
  }
)

clientRouter.post(
  "/closed-dates/:domainPrefix",
  parseDomainPrefix,
  async (req: MyRequest, res) => {
    let { dateArray } = req.body

    const adminEmail = req.client.email

    const calendars = await AdminCalendar.find({ adminEmail }).exec()

    dateArray = dateArray
      .filter((date) => {
        let closed = true

        calendars.forEach((calendar) => {
          const openingHours = getOpeningHoursByDate(
            calendar.schedule,
            DateHelper.new(date).add(12, "hours").toJSON()
          )
          if (openingHours.open) closed = false
        })

        return closed
      })
      .map((date) => 
        DateHelper.new(date).toISOString())
    res.json(dateArray)
  }
)

clientRouter.post(
  "/new-appointment/:domainPrefix",
  parseDomainPrefix,
  bookAppointmentLimiter,
  [
    body("customer.name")
      .isLength({ min: 1 })
      .withMessage("Indtast venligst et navn"), body("customer.email")
      .isEmail()
      .withMessage("Indtast venligst en gyldig E-Mail"), body("customer.phoneNumber")
      .isMobilePhone("da-DK")
      .withMessage("Indtast venligst et gyldigt telefonnummer"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400)
      next(errors.array()[0])
    }

    const {
      service, calendar, time, customer, comment 
    } = req.body

    const adminEmail = req.client.email

    const fetchedService = await Service.findById(service).exec()

    const fetchedCalendar = await AdminCalendar.findOne({ calendarID: calendar }).exec()

    const startTime = DateHelper.utc(time)
    const endTime = startTime.add(
      fetchedService.minutesTaken,
      "minutes"
    )

    await validateAppointment(
      adminEmail,
      fetchedCalendar,
      req.client.bookingSettings,
      startTime.toJSON(),
      endTime.toJSON()
    )

    const cancelToken = await generateCustomerCancelToken(
      JSON.stringify("BOOKTID-" + customer)
    )

    let customerRecord = await Customer.findOne({
      email: customer.email,
      adminEmail: adminEmail,
    }).exec()

    if (!customerRecord) {
      customerRecord = await Customer.create({
        ...customer,
        adminEmail,
      })
    }

    const appointment = await Appointment.create({
      adminEmail: adminEmail,
      calendarID: fetchedCalendar.calendarID,
      customerID: customerRecord._id,
      service: fetchedService.name,
      date: DateHelper
        .utc(time)
        .toJSON()
        .slice(0, 10),
      startTime: time,
      endTime: endTime.toJSON(),
      bookedOnline: true,
      bookedAt: DateHelper.utc().toJSON(),
      comment: comment,
      cancelToken: cancelToken,
      breakAfter: fetchedService.breakAfter,
    })

    res.json({
      date: DateHelper
        .utc(time)
        .toJSON()
        .slice(0, 10),
      startTime: time,
      endTime: endTime.toJSON(),
    })

    await sendConfirmationEmail(
      customer.email,
      {
        business: req.client.businessInfo.name,
        service: fetchedService.name,
        date: DateHelper.utc(appointment.startTime).format("HH:mm D. MMM. YYYY"),
        dateSent: DateHelper.new().format("DD/M YYYY"),
        cancelLink: `https://${req.params.domainPrefix}.booktid.net/cancel?token=${cancelToken}`,
      }
    )

    if (
      req.client.bookingSettings
        .newBookingEmail
    ) {
      setTimeout(() => {
        sendNewBookingEmail(
          req.client.email,
          {
            business: req.client.businessInfo.name,
            service: fetchedService.name,
            customer: customer,
            date:
              DateHelper.utc(appointment.startTime).format("HH:mm - ") +
              DateHelper.utc(appointment.endTime).format("HH:mm D/M/YYYY"),
            dateSent: DateHelper.new().format("DD/M YYYY"),
          }
        )
      }, 3000)
    }

    if (req.client.activatedApps.includes("textReminder")) {
      const textReminderApp = await TextReminderApp.findOne({
        adminEmail: req.client.email,
        activated: true,
      }).exec()

      if (!textReminderApp || !textReminderApp.sendReminders) return

      const {
        _id,
        stripeCustomerID,
      } = await AdminClient
        .findOne({ email: req.client.email, })
        .select("_id stripeCustomerID")
        .exec()

      const [remindAtHour, remindAtMinute] = textReminderApp.remindAt.split(":").map(parseInt)

      const appointmentAt = DateHelper.utc(appointment.startTime).unix()

      const sendAt = DateHelper
        .utc(appointment.startTime)
        .subtract(1, "day")
        .set("hours", remindAtHour)
        .set("minutes", remindAtMinute)
        .subtract(1, "hour")
        .unix()

      await sendTextReminder({
        businessName: req.client.businessInfo.name.replace(".", " "),
        sendAs: textReminderApp.sendAs,
        appointmentAt: `${appointmentAt}`,
        sendAt: `${sendAt}`,
        service: fetchedService.name,
        receiver: {
          name: customer.name.split(" ")[0],
          number: customer.phoneNumber,
        },
        sender: {
          email: req.client.email,
          stripeId: stripeCustomerID,
          userId: _id,
        },
      })
    }
  }
)

clientRouter.get(
  "/appointment/:cancelToken/:domainPrefix",
  parseDomainPrefix,
  async (req: MyRequest, res) => {
    const appointment = await Appointment.findOne({
      adminEmail: req.client.email,
      cancelToken: req.params.cancelToken,
    })

    res.json(appointment)
  }
)

clientRouter.patch(
  "/cancel-appointment/:cancelToken/:domainPrefix",
  parseDomainPrefix,
  async (req: MyRequest, res) => {
    const appointment = await Appointment.findOne({
      adminEmail: req.client.email,
      cancelToken: req.params.cancelToken,
    })

    if (!appointment) {
      throw new BadRequestError("Kunne ikke finde booking.")
    }
    if (appointment.cancelled) {
      return res.json({ success: "Booking aflyst" })
    }
    if (
      !DateHelper
        .utc()
        .add(1, "hour")
        .add(
          req.client.bookingSettings.latestCancelBefore,
          "minutes"
        )
        .isBefore(appointment.startTime)
    ) {
      throw new BadRequestError("For sent at aflyse booking")
    }

    Appointment.findByIdAndUpdate(
      appointment._id,
      {
        cancelled: true, cancelledByCustomer: true
      }
    )

    res.json({ success: "Booking aflyst" })

    const customer = await Customer.findById(
      appointment.customerID
    ).exec()

    if (req.client.bookingSettings.cancelBookingEmail) {
      sendClientCancelEmail(req.client.email, {
        business: req.client.businessInfo.name,
        dateSent: DateHelper.new().format("DD/M YYYY"),
        date:
          DateHelper
            .utc(appointment.startTime)
            .format("HH:mm") +
          DateHelper
            .utc(appointment.endTime)
            .format("HH:mm D MMM YYYY"),
        customer: {
          name: customer.name,
          email: customer.email,
        },
      })
    }
  }
)

clientRouter.get(
  "/personal-data-policy/:domainPrefix",
  parseDomainPrefix,
  async (req: MyRequest, res) => {
    const personalDataPolicy = await AdminClient.findOne({ email: req.client.email, })
      .select("bookingSettings.personalDataPolicy")
      .exec()
    res.json(personalDataPolicy.bookingSettings.personalDataPolicy)
  }
)

export default clientRouter
