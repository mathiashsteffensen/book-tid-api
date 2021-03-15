// Importing express & express-validator
import express, { Response, NextFunction as Next } from 'express'
const { body, validationResult } = require('express-validator');

// Importing types & errors
import {
    MyRequest,
    ServerError,
    BadRequestError
} from "../../types"

// Importing AuthController
import AuthController from "../controllers/AuthController"

// Importing DayJS for working with dates
const dayjs = require('dayjs');
require('dayjs/locale/da')
dayjs.locale('da')

// Importing uniqid to create unique signup confirmation keys + SendGrid integration functions for sending confirmation emails
const uniqid = require('uniqid')
const { sendSignUpConfirmation } = require('../../integrations/sendgrid')

// Importing Stripe SDK
const stripe = require('../../integrations/stripe')

//Importing encryption software
const {
    encryptPassword,
    verifyPassword,
    createToken,
    createBookingDomain
} = require('../../utils')

import {
    verifyAdminKey,
    handleError
} from "../../middleware"

// Importing DB models
const { AdminClient, Service, AdminCalendar, Appointment, Customer, TextReminderApp, ServiceCategory } = require('../../db/models')

// Importing DB queries
const {
    createDefaultCalendar
} = require('../../db/queries');


/*** Creating authorization router & routes ***/
const authRouter = express.Router()

authRouter.post('/signup/free', [
    body('businessInfo.name').exists().withMessage('Udfyld venligst din virksomheds navn - dette bruges til din personlige booking side f.eks. "frisørlacour.booktid.net"'),
    body('name.firstName').isAlpha('da-DK').isLength({min: 1}).withMessage('Udfyld venligst et gyldigt navn'),
    body('email').isEmail().withMessage('Udfyld venligst en gyldig email'),
    body('password').isLength({ min: 5 }).withMessage('Password should be at least 5 characters'),
    body('phoneNumber').isLength({min: 8, max: 12}).withMessage('Telefonnummeret skal være 8 eller 12 tal').isNumeric().withMessage('Telefonnummeret må kun bestå af tal')
  ], handleError(AuthController.signup))

authRouter.get('/confirm-signup/:emailConfirmationKey', (req, res, next) => {
    const {
        emailConfirmationKey
    } = req.params

    console.log(emailConfirmationKey);

    AdminClient.findOne({ emailConfirmationKey }, (err, client) => {
        if (err) next({msg: 'Der skete en fejl'})
        if (!client) {
            res.status(400)
            next({msg: 'Vi kunne ikke finde din registrerede bruger og bekræfte din e-mail, Kontakt venligst support på service@booktid.net'})
        }
        else {
            console.log(client);
            if (client.changingEmail) {
                const newEmailConfirmationKey = uniqid('BOOKTID-')

                AdminClient.findOneAndUpdate({ emailConfirmationKey }, { 
                    email: client.changingEmailTo,
                    emailConfirmationKey: newEmailConfirmationKey,
                    emailConfirmed: false,
                    changingEmail: false,
                 }, (err) => {
                     if (err) return next({msg: 'Der skete en fejl'})
                    // Sends an email to confirm the new email
                    sendSignUpConfirmation(client.changingEmailTo, {
                        confirmLink: `https://admin.booktid.net/bekraeft-email?key=${newEmailConfirmationKey}`,
                        dateSent: dayjs().format('D. MMM YYYY')
                    }).catch(err => console.log(err))

                    res.send(`Vi har bekræftet ændringen af din email til ${client.changingEmailTo} og har sendt en besked for at bekræfte din nye email`)
                 })    
            } else {
                AdminClient.findOneAndUpdate({ emailConfirmationKey }, {emailConfirmed: true}, (err) =>
                {
                    if (err) next({msg: 'Der skete en fejl'})
                    else {
                        res.send('Din e-mail er bekræftet') 
                    }
                })
            } 
        }
    })
})

authRouter.get('/confirm-signup/resend/:apiKey', verifyAdminKey, async (req: MyRequest, res: Response, next: Next) => {
    try {
        const client = await AdminClient.findOne({ email: req.user.email })

        const emailConfirmationKey = uniqid('BOOKTID-')

        await AdminClient.findOneAndUpdate({ email: req.user.email }, { emailConfirmationKey })
        
        await sendSignUpConfirmation(client.email, {
            confirmLink: `https://admin.booktid.net/bekraeft-email?key=${emailConfirmationKey}`,
            dateSent: dayjs().format('D. MMM YYYY')
        }).catch((err: Error) => {
            console.log(err)
        })

        res.send()
    } catch (err) {
        next({msg: err.message})
    }
})

authRouter.post('/login', (req: MyRequest, res, next) =>
{
    if (req.body !== {})
    {
        AdminClient.find({email: req.body.email}, async function(err, user)
        {

            if (err) next({msg: 'Der skete en fejl, prøv venligst igen', stack: err.stack})
            else 
            {
                if (user.length === 0)
                {
                    res.status(400)
                    next({msg: 'Forkert E-Mail eller kodeord', stack: ''})
                } else
                {
                    try
                    {
                        var valid = await verifyPassword(req.body.password, user[0].password)
                        if (valid)
                        {
                            let token = createToken({
                                email: user[0].email,
                                firstName: user[0].name.firstName,
                                stripeCustomerID: user[0].stripeCustomerID,
                                subscriptionType: user[0].subscriptionType,
                            })
                            res.json({apiKey: token})
                        } else 
                        {
                            res.status(400)
                            next({msg: 'Forkert E-Mail eller kodeord', stack: ""})
                        }
                    } catch(err)
                    {
                        res.status(400)
                        next({msg: 'Forkert E-Mail eller kodeord', stack: err.stack})
                    }
                }
            }
        })
    } else
    {
        next({msg: 'Forkert E-Mail eller kodeord', stack: ''})
    }
})

authRouter.get('/verify-key/:apiKey', verifyAdminKey, (req: MyRequest, res) =>
{
    res.send(req.user)
})

authRouter.delete('/my-account/:apiKey', verifyAdminKey, async (req: MyRequest, res, next) => {
    try {

        if (!req.body.password) throw new Error('Forkert kodeord')

        const user = await AdminClient.findOne({ email: req.user.email }).exec()

        const valid = await verifyPassword(req.body.password, user.password)

        if (!valid) throw new Error('Forkert kodeord')

        const services = await Service.find({ adminEmail: req.user.email }).exec()

        const categories = await ServiceCategory.find({ adminEmail: req.user.email }).exec()

        const calendars = await AdminCalendar.find({ adminEmail: req.user.email }).exec()
        
        const appointments = await Appointment.find({ adminEmail: req.user.email }).exec()

        const customers = await Customer.find({ adminEmail: req.user.email }).exec()

        const textReminderApps = await TextReminderApp.find({ adminEmail: req.user.email }).exec()

        console.log("Deleting " + services.length + " services");
        console.log("Deleting " + categories.length + " categories");
        console.log("Deleting " + calendars.length + " calendars");
        console.log("Deleting " + appointments.length + " appointments");
        console.log("Deleting " + customers.length + " customers");
        console.log("Deleting " + textReminderApps.length + " text reminder apps");

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
        }))

        await Promise.all(deletePromises)

        await AdminClient.findByIdAndDelete(user._id)

        res.send()

    } catch(err) {
        next({msg: err.message})
    }
})

module.exports = authRouter