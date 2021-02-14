const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const weekOfYear = require('dayjs/plugin/weekOfYear')
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter')
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore')
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(utc)
dayjs.extend(weekOfYear)

const {
    appointmentsByDay
} = require('./db/queries')

const {
    Service,
    ServiceCategory
} = require('./db/models')

let encryptPassword = async (password) =>
{
    let saltRounds = 12
    let salt = await bcrypt.genSalt(saltRounds)
    let hash = await bcrypt.hash(password, salt)
    return hash
}

let generateCustomerCancelToken = async (customerEmail) =>
{
    let tokenPrefix = 'BOOKTID-'
    let saltRounds = 9
    let salt = await bcrypt.genSalt(saltRounds)
    let hash = (await bcrypt.hash(customerEmail, salt)).replace(new RegExp('.'), 'dot').replace(/\//g, "slash");
    return tokenPrefix + hash
}

let verifyPassword = async(password, hash) =>
{
    try
    {
        let verify = await bcrypt.compare(password, hash)
        return verify
    } catch(err)
    {
        throw new Error(err)
    }
}

let createToken = (userInfo) =>
{

    let token = jwt.sign(userInfo, process.env.JWT_SECRET)
    return token
}

let verifyToken = async (token) =>
{
    try 
    {
        var payload = jwt.verify(token, process.env.JWT_SECRET)
        return payload
    } catch(err)
    {
        throw new Error(err)
    }
}

let validateStartBeforeEnd = (startTime, endTime) =>
{
    return dayjs.utc(startTime).isBefore(dayjs.utc(endTime), "minute")
}

let getWeeklyScheduleByDate = (schedule, date) =>
{
    let thisWeeksSchedule = false;
    let thisWeek = dayjs.utc(date).week()
    let thisYear = dayjs.utc(date).year()
    switch(schedule.scheduleType)
    {
        case 'weekly':
            thisWeeksSchedule = schedule.weeklySchedule
            break;
        case 'biWeekly':
            if (thisWeek % 2 === 0) thisWeeksSchedule = schedule.biWeeklySchedule.evenWeek
            else thisWeeksSchedule = schedule.biWeeklySchedule.unevenWeek
            break;
        default:
    }
    schedule.specialWeek.forEach((week) =>
    {
        if (week.week === thisWeek && week.year === thisYear)
        {
            thisWeeksSchedule = week.schedule
        }
    })
    return thisWeeksSchedule
}

let getOpeningHoursByDate = (schedule, date) =>
{
    let openingHours;
    let thisWeeksSchedule = getWeeklyScheduleByDate(schedule, date)
    let dayOfWeek = dayjs.utc(date).day()
    thisWeeksSchedule.forEach((day) =>
    {
        if (day.day === dayOfWeek) openingHours = day.schedule;
    })

    return openingHours
}

let validateInsideOpeningHours = (appointmentStart, appointmentEnd, schedule) =>
{
    let openingHours = getOpeningHoursByDate(schedule, appointmentStart)

    if (openingHours.open)
    {
        let openTime = dayjs.utc(appointmentStart).set('hour', openingHours.startOfWork.hour).set('minute', openingHours.startOfWork.minute)
        let closingTime = dayjs.utc(appointmentStart).set('hour', openingHours.endOfWork.hour).set('minute', openingHours.endOfWork.minute)
        if (openingHours.break)
        {
            let startBreak = dayjs.utc(appointmentStart).set('hour', openingHours.startOfBreak.hour).set('minute', openingHours.startOfBreak.minute)
            let endBreak = dayjs.utc(appointmentStart).set('hour', openingHours.endOfBreak.hour).set('minute', openingHours.endOfBreak.minute)
            if (
                dayjs.utc(appointmentStart).isSameOrAfter(openTime, 'minute') 
                && dayjs.utc(appointmentEnd).isSameOrBefore(closingTime, 'minute') 
                && (dayjs.utc(appointmentStart).isSameOrAfter(endBreak, 'minute') || dayjs.utc(appointmentEnd).isSameOrBefore(startBreak, 'minute'))
            ) return true
            else return false
        } else
        {
            if (dayjs.utc(appointmentStart).isSameOrAfter(openTime, 'minute') && dayjs.utc(appointmentEnd).isSameOrBefore(closingTime, 'minute')) return true
            else return false
        }
    } else return false
}

let validateNoAppointmentOverlap = async (adminEmail, calendarID, startTime, endTime) =>
{
    let noOverlap = true
    let appointments = await appointmentsByDay(adminEmail, startTime, calendarID).catch((err) => {throw new Error(err)})

    appointments.forEach((appointment) =>
    {
        let startAppointment = dayjs.utc(appointment.startTime)
        let endAppointment = dayjs.utc(appointment.endTime)

        let newStart = dayjs.utc(startTime)
        let newEnd = dayjs.utc(endTime)
        // First check if new start of appointment is before the one checking against
        if (newStart.isBefore(startAppointment))
        {
            // If it is then the end should be too, or they overlap
            if (!newEnd.isSameOrBefore(startAppointment))
            {
                noOverlap = false
            }
        } else
        {
            // If not then the start of the new one shouldnt be before the end of the old one either, or they overlap
            if (!newStart.isSameOrAfter(endAppointment))
            {
                noOverlap = false
            }
        }
    })
    return noOverlap
}

const getCatsAndServices = async (adminEmail) =>
{
    const categories = await ServiceCategory.find({adminEmail}).exec()
        
    const services = await Service.find({adminEmail}).exec()
    
    if (!categories) return [
        {
            category: {
                name: 'Uden Kategori'
            },
            services: services
        }
    ]
    else 
    {
        let catsAndServices = categories.map((category) =>
        {
            return {
                category: category,
                services: services.filter((service) => service.categoryName === category.name)
            }
        })

        let usedServiceIDs = catsAndServices.map(catAndServices => catAndServices.services.map(service => service._id))

        catsAndServices.push({
            category: {name: 'Uden Kategori'},
            services: services.filter((service) =>
            {
                return !usedServiceIDs.includes(service._id)
            })
        })

        return catsAndServices
    }
}

const validateAppointmentObeysBookingSettings = (startTime, bookingSettings) =>
{
    if (dayjs.utc(startTime).isAfter(dayjs.utc().add(1, 'hour').add(bookingSettings.latestBookingBefore, 'minutes')))
    {
        if (dayjs.utc(startTime).isSameOrBefore(dayjs.utc().add(bookingSettings.maxDaysBookAhead, 'days'))) return true
        else return 'For tidligt at booke denne tid'
    } else return 'For sent at booke denne tid'
}

const validateAppointment = async (adminEmail, calendar, bookingSettings, startTime, endTime) =>
{
    return new Promise(async (resolve, reject) =>
    {
        let valid = await validateNoAppointmentOverlap(adminEmail, calendar.calendarID, startTime, endTime).catch(err => console.log(err))
        if (!validateStartBeforeEnd(startTime, endTime)) reject('Slut tid er før start tid')
        else if (!validateInsideOpeningHours(startTime, endTime, calendar.schedule)) reject('Uden for ådningstiden')
        else if (typeof validateAppointmentObeysBookingSettings(startTime, bookingSettings) === 'string') reject(validateAppointmentObeysBookingSettings(startTime, bookingSettings))
        else if (!valid) reject('Overlapper med en anden booking')
        else resolve()
    })
    
}

function createBookingDomain(companyName) {
    return companyName.split(' ').join('').toLowerCase().replace(/ø/g , 'oe').replace(/æ/g, 'ae').replace(/å/g, 'aa').replace(/[.]/g, 'dot').replace(/[/]/g, 'slash').replace(/#/g, 'pound').replace(/[?]/g, 'question').replace(/[=]/g, 'equals')
}

module.exports = {
    encryptPassword,
    verifyPassword,
    createToken,
    verifyToken,
    validateStartBeforeEnd,
    validateInsideOpeningHours,
    validateNoAppointmentOverlap,
    getCatsAndServices,
    getOpeningHoursByDate,
    validateAppointmentObeysBookingSettings,
    validateAppointment,
    generateCustomerCancelToken,
    createBookingDomain
}