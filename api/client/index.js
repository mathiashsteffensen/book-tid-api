const express = require('express')
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
    AdminClient,
    AdminCalendar,
    Service,
} = require('../../db/models')

const {
    getOpeningHoursByDate,
    validateInsideOpeningHours,
    validateNoAppointmentOverlap,
    validateStartBeforeEnd
} = require('../../utils')

clientRouter.use(cors())

clientRouter.get('/theme/:domainPrefix', parseDomainPrefix, async (req, res, next) =>
{
    delete req.client.email
    res.json(req.client)
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
        const service = await Service.findById(serviceID).exec()
        const timeTaken = service.minutesTaken

        const calendarQuery = await AdminCalendar.find({adminEmail}).exec()

        let calendars = await Promise.all(calendarQuery.map(calendar => 
        {
            calendar.openingHours = getOpeningHoursByDate(calendar.schedule, dayjs.utc(date).add(12, 'hours').toJSON())
            return calendar
        }).map(async (calendar) =>
        {
            const openingHours = calendar.openingHours

            if (openingHours.open)
            {
                let returnArray = []
                let startTime = dayjs.utc(date).add(12, 'hours').hour(openingHours.startOfWork.hour).minute(openingHours.startOfWork.minute)
                let endTime = startTime.add(timeTaken, 'minutes')
                let closeTime = dayjs.utc(date).add(12, 'hours').hour(openingHours.endOfWork.hour).minute(openingHours.endOfWork.minute)
                console.log(closeTime.toJSON())
                do 
                {
                    if (
                        validateStartBeforeEnd(startTime.toJSON(), endTime.toJSON()) 
                        && validateInsideOpeningHours(startTime.toJSON(), endTime.toJSON(), calendar.schedule)
                    ) 
                    {
                        let doesntOverlap = await validateNoAppointmentOverlap(adminEmail, calendar.calendarID, startTime.toJSON(), endTime.toJSON()).catch((err) => next({msg: err.message}))
                        if (doesntOverlap) returnArray.push({startTime: startTime.toJSON(), endTime: endTime.toJSON()})       
                    }

                    startTime = endTime
                    endTime = startTime.add(timeTaken, 'minute')
                } while (endTime.isSameOrBefore(closeTime, 'minute'))

                calendar.availableTimes = returnArray

                return calendar

            } else return null
        }))
        calendars = calendars.filter(calendar => calendar !== null)
        console.log(calendars.length)
        res.json(calendars.map(query =>
        {
            console.log(query)
            return {
                calendar: query,
                availableTimes: query.availableTimes
            } 
        }))
    } catch (err)
    {
        next({msg: err.msg})
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
            console.log(openingHours, date);
            if (openingHours.open) closed = false
        })

        return closed
    }).map((date) => dayjs(date).format('DD/MM/YYYY'))
    res.json(dateArray)
})

clientRouter.post('/new-appointment/:domainPrefix', parseDomainPrefix, async (req, res, next) =>
{
    res.send(req.body)
})

module.exports = clientRouter