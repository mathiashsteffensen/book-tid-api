const express = require('express')

const {body, validationResult} = require('express-validator')

const { 
    verifyAdminKey,
    verifyCalendarID, 
    fetchCalendar 
} = require('../../middleware')

const {
    validateStartBeforeEnd,
    validateInsideOpeningHours,
    validateNoAppointmentOverlap,
    generateCustomerCancelToken
} = require('../../utils')

const {
    sendConfirmationEmail,
    sendClientCancelEmail
} = require('../../integrations/sendgrid')

const {
    Customer,
    Appointment
} = require('../../db/models')

const {
    appointmentsByDay,
    appointmentsByWeek,
    appointmentsByMonth,
    appointmentsByYear,
    appointmentsByInterval,
    obeysBookingRestrictions
} = require('../../db/queries')

const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
require('dayjs/locale/da')
dayjs.extend(utc)
dayjs.locale('da')

let appointmentRouter = express.Router()

appointmentRouter.post('/create/:apiKey/:calendarID', verifyAdminKey, verifyCalendarID,
body('service').exists().withMessage('Specificer venligst en service'),
body('customerID').exists().withMessage('Specificer venligst en kunde'),
body('startTime').exists().withMessage('Specificer venligst en start tid').custom((startTime, { req }) =>
{
    return validateStartBeforeEnd(startTime, req.body.endTime)
}).withMessage('Start tiden skal være før slut tiden'),
body('endTime').exists().withMessage('Specificer venligst en slut tid').custom((endTime, { req }) =>
{
    return validateInsideOpeningHours(req.body.startTime, endTime, req.calendar.schedule)
}).withMessage('Tiden skal være inden for åbningstiden'), 
(req, res, next) =>
{
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400)
        return next({msg: errors.array()[0].msg});
    }
    Customer.findById(req.body.customerID, async (err, customer) =>
    {
        if (err) next({msg: 'Der skete en fejl prøv venligst igen'})
        if (customer)
        {
            if (!(await obeysBookingRestrictions(req.user, dayjs.utc(req.body.startTime).toJSON().slice(0, 10)))) next({msg: 'Du har nået din begrænsning for bookinger i den her måned, opgrader venligst for at få det meste ud af BOOKTID.NET'})

            validateNoAppointmentOverlap(req.user.email, req.params.calendarID, req.body.startTime, req.body.endTime).then(async (noOverlap) =>
            {
                if (noOverlap)
                {
                    const cancelToken = await generateCustomerCancelToken(customer.email).catch(() => next({msg: 'Der skete en fejl prøv venligst igen'}))
                    Appointment.create({
                        ...req.body,
                        ...{
                            date: dayjs.utc(req.body.startTime).toJSON().slice(0, 10),
                            calendarID: req.params.calendarID,
                            adminEmail: req.user.email,
                            bookedOnline: false,
                            bookedAt: dayjs.utc().toJSON(),
                            cancelToken: cancelToken
                        }
                    }, (err, appointment) =>
                    {
                        if (err) next({msg: 'Der skete en fejl prøv venligst igen'})
                        else res.json(appointment)
                    })
                } else
                {
                    res.status(400)
                    next({msg: 'Medarbejderen har en booking i perioden'})
                }
            }).catch((err) =>
            {
                next(err)
            })
        } else
        {
            res.status(400)
            next({msg: 'Ugyldigt kunde ID'})
        }
    })
})

appointmentRouter.post('/update/:apiKey/:calendarID/:appointmentID', verifyAdminKey, verifyCalendarID,
body('startTime').custom((startTime, { req }) =>
{
    return validateStartBeforeEnd(startTime, req.body.endTime)
}).withMessage('Start tiden skal være før slut tiden'),
body('endTime').custom((endTime, { req }) =>
{
    return validateInsideOpeningHours(req.body.startTime, endTime, req.calendar.schedule)
}).withMessage('Tiden skal være inden for åbningstiden'), 
async (req, res, next) =>
{
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400)
        return next(errors.array()[0]);
    }

    if (req.body.customerID)
    {
        var customer = await Customer.findById(req.body.customerID).exec().catch(() => next())
    }

    if (customer)
    {
        validateNoAppointmentOverlap(req.user.email, req.params.calendarID, req.body.startTime, req.body.endTime).then((noOverlap) =>
        {
            if (noOverlap)
            {
                Appointment.findByIdAndUpdate(req.params.appointmentID, req.body, (err, appointment) =>
                {
                    if (err) next({msg: 'Der skete en fejl prøv venligst igen'})
                    else res.json(appointment)
                })
            } else
            {
                res.status(400)
                next({msg: 'Medarbejderen har en booking i perioden'})
            }
        }).catch((err) =>
        {
            next(err)
        })
    } else
    {
        res.status(400)
        next({msg: 'Ugyldigt kunde ID'})
    }
})

appointmentRouter.get('/all/:apiKey/:calendarID?', verifyAdminKey, fetchCalendar, (req, res, next) =>
{
    if (req.calendar)
    {
        Appointment.find({
            adminEmail: req.user.email,
            calendarID: req.calendar.calendarID,
            cancelled: false
        }, (err, appointments) =>
        {
            if (err) next()
            else res.json(appointments)
        })
    } else
    {
        Appointment.find({
            adminEmail: req.user.email,
            cancelled: false
        }, (err, appointments) =>
        {
            if (err) next()
            else res.json(appointments)
        })
    }
    
})

appointmentRouter.get('/on-day/:apiKey/:dateInJSON/:calendarID?', verifyAdminKey, fetchCalendar, (req, res, next) =>
{
    appointmentsByDay(req.user.email, req.params.dateInJSON, req.params.calendarID)
    .then((appointments) => res.json(appointments))
    .catch((err) => next(err))
})

appointmentRouter.get('/in-week/:apiKey/:dateInJSON/:calendarID?', verifyAdminKey, fetchCalendar, (req, res, next) =>
{
    appointmentsByWeek(req.user.email, req.params.dateInJSON, req.params.calendarID)
    .then((appointments) => res.json(appointments))
    .catch((err) => next(err))
})

appointmentRouter.get('/in-month/:apiKey/:dateInJSON/:calendarID?', verifyAdminKey, fetchCalendar, (req, res, next) =>
{
    appointmentsByMonth(req.user.email, req.params.dateInJSON, req.params.calendarID)
    .then((appointments) => res.json(appointments))
    .catch((err) => next(err))
})

appointmentRouter.get('/in-year/:apiKey/:dateInJSON/:calendarID?', verifyAdminKey, fetchCalendar, (req, res, next) =>
{
    appointmentsByYear(req.user.email, req.params.dateInJSON, req.params.calendarID)
    .then((appointments) => res.json(appointments))
    .catch((err) => next(err))
})

appointmentRouter.get('/in-interval/:apiKey/:startDate/:endDate/:calendarID?', verifyAdminKey, fetchCalendar, (req, res, next) => {
    appointmentsByInterval(req.user.email, req.params.startDate, req.params.endDate, req.params.calendarID)
    .then((appointments) => res.json(appointments))
    .catch((err) => next(err))
})

appointmentRouter.delete('/:apiKey/:appointmentID', verifyAdminKey, (req, res, next) =>
{
    Appointment.findByIdAndUpdate(req.params.appointmentID, { cancelled: true }, (err) =>
    {
        if (err) next()
        else res.send()
    })
})

module.exports = appointmentRouter