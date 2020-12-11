const express = require('express')
const { body, validationResult } = require('express-validator');
const cors = require('cors')

const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore')
dayjs.extend(isSameOrBefore)
dayjs.extend(utc)

const clientRouter = express.Router()

const {
    parseDomainPrefix
} = require('../../middleware')

const {
    AdminCalendar,
    Service,
    Appointment,
    Customer
} = require('../../db/models')

const {
    getOpeningHoursByDate,
    validateAppointment
} = require('../../utils')

clientRouter.use(cors())

clientRouter.get('/theme/:domainPrefix', parseDomainPrefix, async (req, res, next) =>
{
    if (req.client) res.json(req.client)
    else 
    {
        res.status(404)
        res.json({msg: 'client not found'})
    }
})

clientRouter.get('/available-times/:domainPrefix/:serviceID/:date', parseDomainPrefix, async (req, res, next) =>
{
    const {
        serviceID,
        date
    } = req.params

    const adminEmail = req.adminEmail

    try 
    {
        const service = await Service.findById(serviceID).exec().catch(err => {throw new Error('non-existent service ID')})
        if (!service) throw new Error('non-existent service ID')
        const timeTaken = service.minutesTaken
 
        const calendarQuery = await AdminCalendar.find({adminEmail}).exec()

        let calendars = await Promise.all(calendarQuery.map(calendar => 
        {
            calendar.openingHours = getOpeningHoursByDate(calendar.schedule, date)
            return calendar
        }).map(async (calendar) =>
        {
            const openingHours = calendar.openingHours
            const bookingSettings = req.client.bookingSettings
            if (openingHours.open)
            {
                let returnArray = []
                let startTime = dayjs.utc(date).add(1, 'hour').hour(openingHours.startOfWork.hour).minute(openingHours.startOfWork.minute)
                let endTime = startTime.add(timeTaken, 'minutes')
                let closeTime = dayjs.utc(date).add(1, 'hour').hour(openingHours.endOfWork.hour).minute(openingHours.endOfWork.minute)

                do 
                {
                    await validateAppointment(adminEmail, calendar, bookingSettings, startTime.toJSON(), endTime.toJSON())
                    .then(() =>
                    {
                        returnArray.push({startTime, endTime})
                    }).catch(err => console.log(date, err))

                    startTime = endTime
                    endTime = startTime.add(timeTaken, 'minute')
                } while (endTime.isSameOrBefore(closeTime, 'minute'))

                calendar.availableTimes = returnArray

                return calendar

            } else return null
        }))
        .catch(err => console.log(err))

        calendars = calendars.filter(calendar => calendar !== null)

        res.json(calendars.map(query =>
        {
            return {
                calendar: query,
                availableTimes: query.availableTimes
            } 
        }))
    } catch (err)
    {
        res.status(400)
        next({msg: err.message})
    }  
})

clientRouter.post('/closed-dates/:domainPrefix', parseDomainPrefix, async (req, res) =>
{
    let {
        dateArray
    } = req.body

    const adminEmail = req.adminEmail

    const calendars = await AdminCalendar.find({adminEmail}).exec()

    dateArray = dateArray.filter((date) =>
    {
        let closed = true

        calendars.forEach((calendar) =>
        {
            const openingHours = getOpeningHoursByDate(calendar.schedule, dayjs(date).add(12, 'hours').toJSON())
            if (openingHours.open) closed = false
        })

        return closed
    }).map((date) => dayjs(date).toISOString())
    res.json(dateArray)
})

clientRouter.post('/new-appointment/:domainPrefix', parseDomainPrefix, [
    body('customer.name').isLength({min: 1}).withMessage('Indtast venligst et navn'),
    body('customer.email').isEmail().withMessage('Indtast venligst en gyldig E-Mail')
], async (req, res, next) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400)
        next(errors.array()[0])
    }

    const {
        service,
        calendar,
        time,
        customer,
        comment
    } = req.body

    if (!service) 
    {
        res.status(400)
        next({msg: 'Specificer venligst en service'})
    } else if (!calendar)
    {
        res.status(400)
        next({msg: 'Specificer venligst en medarbejder'})
    } else if (!time)
    {
        res.status(400)
        next({msg: 'Specificer venligst en tid'})
    } else
    {
        const adminEmail = req.adminEmail

        try 
        {
            const fetchedService = await Service.findById(service).exec().catch(() =>
            {
                res.status(400)
                throw new Error('Ikke genkendelig service')
            })
            if (!fetchedService)
            {
                res.status(400)
                throw new Error('Ikke genkendelig service')
            }

            const fetchedCalendar = await AdminCalendar.findOne({calendarID: calendar}).exec()
            if (!fetchedCalendar)
            {
                res.status(400)
                throw new Error('Ikke genkendelig kalender')
            }

            const startTime = dayjs.utc(time)
            const endTime = startTime.add(fetchedService.minutesTaken, 'minutes')
            
            validateAppointment(adminEmail, fetchedCalendar, req.client.bookingSettings, startTime.toJSON(), endTime.toJSON())
            .then(() =>
            {
                Customer.findOne({email: customer.email, adminEmail: adminEmail}).exec((err, customer1) =>
                {
                    if (err) next()
                    else if (customer1)
                    {
                        Appointment.create({
                            adminEmail: adminEmail,
                            calendarID: fetchedCalendar.calendarID,
                            customerID: customer1._id,
                            service: fetchedService._id,
                            date: dayjs.utc(time).toJSON().slice(0, 10),
                            startTime: time,
                            endTime: endTime.toJSON(),
                            bookedOnline: true,
                            bookedAt: dayjs.utc().toJSON(),
                            comment: comment
                        }, (err) =>
                        {
                            if (err) next()
                            else 
                            {
                                res.json({
                                    date: dayjs.utc(time).toJSON().slice(0, 10),
                                    startTime: time,
                                    endTime: endTime.toJSON()
                                })
                            }
                        }) 
                    } else
                    {
                       Customer.create({
                           ...customer,
                           ...{adminEmail}
                       }, (err, customer2) =>
                       {
                           if (err) next()
                           else
                           {
                                Appointment.create({
                                    adminEmail: adminEmail,
                                    calendarID: fetchedCalendar.calendarID,
                                    customerID: customer2._id,
                                    service: fetchedService._id,
                                    date: dayjs.utc(time).toJSON().slice(0, 10),
                                    startTime: time,
                                    endTime: endTime.toJSON(),
                                    bookedOnline: true,
                                    bookedAt: dayjs.utc().toJSON(),
                                    comment: comment
                                }, (err) =>
                                {
                                    if (err) next()
                                    else 
                                    {
                                        res.json({
                                            date: dayjs.utc(time).toJSON().slice(0, 10),
                                            startTime: time,
                                            endTime: endTime.toJSON()
                                        })
                                    }
                                })  
                           }
                       })
                    }
                })
                
            })
            .catch((err) =>
            {
                res.status(400)
                console.log(err.message)
                next({msg: err.message})
            })
            
        } catch (err)
        {
            next({msg: err.message})
        }
    }

})

module.exports = clientRouter