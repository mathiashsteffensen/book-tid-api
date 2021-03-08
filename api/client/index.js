const express = require("express");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const cors = require("cors");

const dayjs = require("dayjs");
require("dayjs/locale/da");
const utc = require("dayjs/plugin/utc");
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.locale("da");

const clientRouter = express.Router();

const { parseDomainPrefix } = require("../../middleware");

const { sendTextReminder } = require('../../integrations/sms')

const {
  AdminCalendar,
  Service,
  ServiceCategory,
  Appointment,
  Customer,
  AdminClient,
  TextReminderApp
} = require("../../db/models");

const {
  obeysBookingRestrictions,
} = require('../../db/queries')

const {
  getOpeningHoursByDate,
  validateAppointment,
  generateCustomerCancelToken,
} = require("../../utils");

const {
  sendConfirmationEmail,
  sendNewBookingEmail,
  sendClientCancelEmail,
} = require("../../integrations/sendgrid");

const bookAppointmentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // start blocking after 15 requests
  message:
    "Der er booket for mange tider fra denne IP-addresse, prøv venligst igen efter èn time, dette er en sikkerhedsforanstaltning"
});

const clientAPILimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200
})

clientRouter.use(cors());

clientRouter.use(clientAPILimiter)

clientRouter.get(
  "/theme/:domainPrefix",
  parseDomainPrefix,
  async (req, res, next) => {
    if (req.client && req.client.emailConfirmed) res.json(req.client);
    else {
      res.status(404);
      res.json({ msg: "client not found" });
    }
  }
);

clientRouter.get(
  "/available-times/:domainPrefix/:serviceID/:date",
  parseDomainPrefix,
  async (req, res, next) => {


    const { serviceID, date } = req.params;

    const adminEmail = req.adminEmail;

    try {

      const service = await Service.findById(serviceID)
        .exec()
        .catch((err) => {
          throw new Error("non-existent service ID");
        });
      if (!service) throw new Error("non-existent service ID");
      const timeTaken = service.minutesTaken + service.breakAfter;

      const user = (await AdminClient.find({ email: adminEmail }).exec())[0]

      const canBookThisMonth = await obeysBookingRestrictions(user, dayjs(date).add(12, 'hours').toJSON().slice(0, 10))

      const calendarQuery = !service.allCalendars 
        ? await Promise.all(service.elgibleCalendars.map(async (calendar) => await AdminCalendar.findOne({ adminEmail, _id: calendar.id }).exec())) 
        : await AdminCalendar.find({ adminEmail }).exec()

      if (canBookThisMonth)
      {

        var calendars = await Promise.all(
        calendarQuery
          .map((calendar, i) => {

            calendar.openingHours = getOpeningHoursByDate(
              calendar.schedule,
              dayjs
                .utc(date)
                .add(12, 'hours')
                .toJSON()
            );
            calendar.name === 'Mathias' && console.log(calendar.openingHours)
            return calendar;
          })
          .map(async (calendar, i) => {

            const openingHours = calendar.openingHours;

            const bookingSettings = req.client.bookingSettings;
            if (openingHours.open) {
              let returnArray = [];
              let startTime = dayjs
                .utc(date)
                .add(12, 'hours')
                .hour(openingHours.startOfWork.hour)
                .minute(openingHours.startOfWork.minute);
              let endTime = startTime.add(timeTaken, "minutes");
              let closeTime = dayjs
                .utc(date)
                .add(12, 'hours')
                .hour(openingHours.endOfWork.hour)
                .minute(openingHours.endOfWork.minute);

              do {
                await validateAppointment(
                  adminEmail,
                  calendar,
                  bookingSettings,
                  startTime.toJSON(),
                  endTime.toJSON()
                )
                  .then(() => {
                    returnArray.push({ startTime, endTime });
                    startTime = endTime;
                    endTime = startTime.add(timeTaken, "minute");
                  })
                  .catch(() => {
                    startTime = endTime;
                    endTime = startTime.add(timeTaken, "minute");
                  });

              } while (endTime.isSameOrBefore(closeTime, "minute"));

              calendar.availableTimes = returnArray;

              return calendar;
            } else return null;
          })
        ).catch((err) => console.log(err));

      } else 
      {
        calendarQuery[0].availableTimes = []
        var calendars = calendarQuery
      }

      calendars = calendars.filter((calendar) => calendar !== null);

      res.json(
        calendars.map((query) => {
          return {
            calendar: query,
            availableTimes: query.availableTimes,
          };
        })
      );

    } catch (err) {
      res.status(400);
      next({ msg: err.message });
    }

    
  }
);

clientRouter.get(
  "/services-and-categories/:domainPrefix",
  parseDomainPrefix,
  async (req, res) => {
    const services = await Service.find({ adminEmail: req.adminEmail })
      .select("-adminEmail")
      .exec();
    const categories = await ServiceCategory.find({
      adminEmail: req.adminEmail,
    })
      .select("-adminEmail")
      .exec();

    res.json({ services, categories });
  }
);

clientRouter.post(
  "/closed-dates/:domainPrefix",
  parseDomainPrefix,
  async (req, res) => {
    let { dateArray } = req.body;

    const adminEmail = req.adminEmail;

    const calendars = await AdminCalendar.find({ adminEmail }).exec();

    dateArray = dateArray
      .filter((date) => {
        let closed = true;

        calendars.forEach((calendar) => {
          const openingHours = getOpeningHoursByDate(
            calendar.schedule,
            dayjs(date).add(12, "hours").toJSON()
          );
          if (openingHours.open) closed = false;
        });

        return closed;
      })
      .map((date) => dayjs(date).toISOString());
    res.json(dateArray);
  }
);

clientRouter.post(
  "/new-appointment/:domainPrefix",
  parseDomainPrefix,
  bookAppointmentLimiter,
  [
    body("customer.name")
      .isLength({ min: 1 })
      .withMessage("Indtast venligst et navn"),
    body("customer.email")
      .isEmail()
      .withMessage("Indtast venligst en gyldig E-Mail"),
    body("customer.phoneNumber")
      .isMobilePhone("da-DK")
      .withMessage("Indtast venligst et gyldigt telefonnummer"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400);
      next(errors.array()[0]);
    }

    const { service, calendar, time, customer, comment } = req.body;

    if (!service) {
      res.status(400);
      return next({ msg: "Specificer venligst en service" });
    } else if (!calendar) {
      res.status(400);
      return next({ msg: "Specificer venligst en medarbejder" });
    } else if (!time) {
      res.status(400);
      return next({ msg: "Specificer venligst en tid" });
    } else {
      const adminEmail = req.adminEmail;

      if (!customer)
        return next({ msg: "Indtast venligst et navn og en gyldig E-Mail" });

      try {
        const fetchedService = await Service.findById(service)
          .exec()
          .catch(() => {
            res.status(400);
            throw new Error("Ikke genkendelig service");
          });
        if (!fetchedService) {
          res.status(400);
          throw new Error("Ikke genkendelig service");
        }

        const fetchedCalendar = await AdminCalendar.findOne({
          calendarID: calendar,
        }).exec();
        if (!fetchedCalendar) {
          res.status(400);
          throw new Error("Ikke genkendelig kalender");
        }

        const startTime = dayjs.utc(time);
        const endTime = startTime.add(fetchedService.minutesTaken, "minutes");

        validateAppointment(
          adminEmail,
          fetchedCalendar,
          req.client.bookingSettings,
          startTime.toJSON(),
          endTime.toJSON()
        )
          .then(async () => {
            const cancelToken = await generateCustomerCancelToken(
              JSON.stringify("BOOKTID-" + customer)
            );

            Customer.findOne({
              email: customer.email,
              adminEmail: adminEmail,
            }).exec((err, customer1) => {
              if (err) throw new Error('Der skete en fejl.')
              else if (customer1) {
                Appointment.create(
                  {
                    adminEmail: adminEmail,
                    calendarID: fetchedCalendar.calendarID,
                    customerID: customer1._id,
                    service: fetchedService.name,
                    date: dayjs.utc(time).toJSON().slice(0, 10),
                    startTime: time,
                    endTime: endTime.toJSON(),
                    bookedOnline: true,
                    bookedAt: dayjs.utc().toJSON(),
                    comment: comment,
                    cancelToken: cancelToken,
                    breakAfter: fetchedService.breakAfter
                  },
                  async (err, appointment) => {
                    if (err) throw new Error('Der skete en fejl.')
                    else {
                      res.json({
                        date: dayjs.utc(time).toJSON().slice(0, 10),
                        startTime: time,
                        endTime: endTime.toJSON(),
                      });

                      await sendConfirmationEmail(customer.email, {
                        business: req.client.businessInfo.name,
                        service: fetchedService.name,
                        date: dayjs
                          .utc(appointment.startTime)
                          .format("HH:mm D. MMM. YYYY"),
                        dateSent: dayjs().format("DD/M YYYY"),
                        cancelLink: `https://${req.params.domainPrefix}.booktid.net/cancel?token=${cancelToken}`,
                      });

                      setTimeout(() => {
                        if (req.client.bookingSettings.newBookingEmail) {
                          sendNewBookingEmail(req.adminEmail, {
                            business: req.client.businessInfo.name,
                            service: fetchedService.name,
                            customer: customer,
                            date:
                              dayjs.utc(appointment.startTime).format("HH:mm - ") +
                              dayjs
                                .utc(appointment.endTime)
                                .format("HH:mm D/M/YYYY"),
                            dateSent: dayjs().format("DD/M YYYY"),
                          });
                        }
                      }, 3000);

                      if (req.client.activatedApps.includes('textReminder')) {
                        console.log('gonna try to schedule a text')
                        const textReminderApp = await TextReminderApp.findOne({ adminEmail: req.client.email,  activated: true}).exec()
                        
                        if (!textReminderApp || !textReminderApp.sendReminders) return;

                        const {_id, stripeCustomerID} = await AdminClient.findOne({ email: req.client.email }).select('_id stripeCustomerID').exec()
                        
                        const appointmentAt = dayjs.utc(appointment.startTime).unix()

                        const sendAt = dayjs.utc(appointment.startTime).subtract(1, 'day').set('hours', textReminderApp.remindAt.split(':')[0]).set('minutes', textReminderApp.remindAt.split(':')[1]).subtract(1, 'hour').unix()

                        await sendTextReminder({
                          businessName: req.client.businessInfo.name.replace('.', ' '),
                          sendAs: textReminderApp.sendAs,
                          appointmentAt: `${appointmentAt}`,
                          sendAt: `${sendAt}`,
                          service: fetchedService.name,
                          receiver: {
                            name: customer.name.split(' ')[0],
                            number: customer.phoneNumber
                          },
                          sender: {
                            email: req.client.email,
                            stripeId: stripeCustomerID,
                            userId: _id
                          }
                        }).catch(err => console.log(err))
                      }
                    }
                  }
                );
              } else {
                Customer.create(
                  {
                    ...customer,
                    ...{ adminEmail },
                  },
                  (err, customer2) => {
                    if (err) throw new Error('Der skete en fejl.')
                    else {
                      Appointment.create(
                        {
                          adminEmail: adminEmail,
                          calendarID: fetchedCalendar.calendarID,
                          customerID: customer2._id,
                          service: fetchedService.name,
                          date: dayjs.utc(time).toJSON().slice(0, 10),
                          startTime: time,
                          endTime: endTime.toJSON(),
                          bookedOnline: true,
                          bookedAt: dayjs.utc().toJSON(),
                          comment: comment,
                          cancelToken: cancelToken,
                          breakAfter: fetchedService.breakAfter
                        },
                        async(err, appointment) => {
                          if (err) throw new Error('Der skete en fejl.')
                          else {
                            res.json({
                              date: dayjs.utc(time).toJSON().slice(0, 10),
                              startTime: time,
                              endTime: endTime.toJSON(),
                            });

                            sendConfirmationEmail(customer.email, {
                              business: req.client.businessInfo.name,
                              service: fetchedService.name,
                              date: dayjs
                                .utc(appointment.startTime)
                                .format("HH:mm D. MMM YYYY"),
                              dateSent: dayjs().format("DD/M YYYY"),
                              cancelLink: `https://${req.params.domainPrefix}.booktid.net/cancel?token=${cancelToken}`,
                            });

                            setTimeout(() => {
                              if (req.client.bookingSettings.newBookingEmail) {
                                sendNewBookingEmail(req.adminEmail, {
                                  business: req.client.businessInfo.name,
                                  service: fetchedService.name,
                                  customer: customer,
                                  date:
                                    dayjs
                                      .utc(appointment.startTime)
                                      .format("HH:mm") +
                                    dayjs
                                      .utc(appointment.endTime)
                                      .format("HH:mm D/M/YYYY"),
                                  dateSent: dayjs().format("DD/M YYYY"),
                                });
                              }
                            }, 3000);

                            if (req.client.activatedApps.includes('textReminder')) {
                              console.log('gonna try to schedule a text')
                              const textReminderApp = await TextReminderApp.findOne({ adminEmail: req.client.email,  activated: true}).exec()
                              
                              if (!textReminderApp || !textReminderApp.sendReminders) return;
      
                              const {_id, stripeCustomerID} = await AdminClient.findOne({ email: req.client.email }).select('_id stripeCustomerID').exec()
                              
                              const appointmentAt = dayjs.utc(appointment.startTime).unix()
      
                              const sendAt = dayjs.utc(appointment.startTime).subtract(1, 'day').set('hours', textReminderApp.remindAt.split(':')[0]).set('minutes', textReminderApp.remindAt.split(':')[1]).subtract(1, 'hour').unix()

                              await sendTextReminder({
                                businessName: req.client.businessInfo.name.replace('.', ' '),
                                sendAs: textReminderApp.sendAs,
                                appointmentAt: `${appointmentAt}`,
                                sendAt: `${sendAt}`,
                                service: fetchedService.name,
                                receiver: {
                                  name: customer.name.split(' ')[0],
                                  number: customer.phoneNumber
                                },
                                sender: {
                                  email: req.client.email,
                                  stripeId: stripeCustomerID,
                                  userId: _id
                                }
                              }).catch(err => console.log(err))
                            }
                          }
                        }
                      );
                    }
                  }
                );
              }
            });
          })
          .catch((err) => {
            res.status(400);
            console.log(err, "invalid appointment");
            next({ msg: err });
          });
      } catch (err) {
        console.log(err);
        next({ msg: err.message });
      }
    }
  }
);

clientRouter.get(
  "/appointment/:cancelToken/:domainPrefix",
  parseDomainPrefix,
  async (req, res, next) => {
    Appointment.findOne(
      {
        adminEmail: req.adminEmail,
        cancelToken: req.params.cancelToken,
      },
      (err, appointment) => {
        if (err) next();
        res.json(appointment);
      }
    );
  }
);

clientRouter.patch(
  "/cancel-appointment/:cancelToken/:domainPrefix",
  parseDomainPrefix,
  async (req, res, next) => {
    Appointment.findOne(
      {
        adminEmail: req.adminEmail,
        cancelToken: req.params.cancelToken,
      },
      (err, appointment) => {
        if (err) return next({msg: 'Der skete en fejl'});
        if (!appointment) return next({ msg: "Kunne ikke finde booking." });
        if (appointment.cancelled) return res.json({ success: "Booking aflyst" });
        console.log(
          dayjs
            .utc()
            .add(1, "hour")
            .add(req.client.bookingSettings.latestCancelBefore, "minutes")
            .toJSON()
        );
        if (
          !dayjs
            .utc()
            .add(1, "hour")
            .add(req.client.bookingSettings.latestCancelBefore, "minutes")
            .isBefore(appointment.startTime)
        )
          return next({msg: 'For sent at aflyse booking'});

        Appointment.findByIdAndUpdate(
          appointment._id,
          { cancelled: true, cancelledByCustomer: true },
          async (err) => {
            if (err) next({msg: 'Der skete en fejl'});
            res.json({ success: "Booking aflyst" });

            const customer = await Customer.findById(
              appointment.customerID
            ).exec();

            if (req.client.bookingSettings.cancelBookingEmail) {
              sendClientCancelEmail(req.adminEmail, {
                business: req.client.businessInfo.name,
                dateSent: dayjs().format("DD/M YYYY"),
                date:
                  dayjs.utc(appointment.startTime).format("HH:mm") +
                  dayjs.utc(appointment.endTime).format("HH:mm D MMM YYYY"),
                customer: {
                  name: customer.name,
                  email: customer.email,
                },
              });
            }
          }
        );
      }
    );
  }
);

clientRouter.get('/personal-data-policy/:domainPrefix', parseDomainPrefix, async (req, res, next) => {
  try {
    const personalDataPolicy = await AdminClient.findOne({ domainPrefix: req.client.domainPrefix }).select('bookingSettings.personalDataPolicy').exec()
    console.log(personalDataPolicy);
    res.json(personalDataPolicy.bookingSettings.personalDataPolicy)
  } catch (err) {
    next({msg: err.message, stack: err.stack})
  }
})

module.exports = clientRouter;
