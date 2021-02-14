// Importing express & express-validator
const express = require('express')
const { body, validationResult } = require('express-validator');

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

const {
    verifyAdminKey
} = require('../../middleware')

// Importing DB models
const { AdminClient, Service } = require('../../db/models')

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
    body('phoneNumber').isLength({min: 8, max: 12}).withMessage('Phone Number should be between 8-12 numbers').isNumeric().withMessage('Phone Number should be numeric')
  ], async (req, res, next) =>
{
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400)
        return next(errors.array()[0]);
    }

    // Creates a stripe customer account
    const customer = await stripe.customers.create({
        email: req.body.email,
    });

    const emailConfirmationKey = uniqid('BOOKTID-')

    // Info that isnt customizable, this is signup for a free account only
    let defaultInfo = {
        bookingSettings: {domainPrefix: createBookingDomain(req.body.businessInfo.name)},
        subscriptionType: 'free',
        subscriptionStart: Date.now(),
        maxNumberOfCalendars: 1,
        stripeCustomerID: customer.id,
        status: 'active',
        emailConfirmationKey,
    }

    // Encrypting password
    req.body.password = await encryptPassword(req.body.password)
    
    // Merging user info with default info
    let userInfo = {
        ...req.body,
        ...defaultInfo,
        ...{
            email: req.body.email.toLowerCase()
        }
    }

    // Creates the user
    await AdminClient.create(userInfo, async function(err, user)
    {
        if (err) {
            if (err.code === 11000)
            {
                // Handle duplication errors
                const errorKey = Object.keys(err.keyValue)[0]

                console.log(err, errorKey.toString());
                switch (errorKey) {
                    case 'bookingSettings.domainPrefix':
                        let findingAlternativePrefix = true

                        for (let attempt = 1; findingAlternativePrefix; attempt++) {
                            console.log(attempt);
                            userInfo.bookingSettings.domainPrefix = createBookingDomain(req.body.businessInfo.name + attempt)
                            console.log(userInfo.bookingSettings.domainPrefix);
                            const user2 = await AdminClient.create(userInfo).catch(() => {}) 

                            if (user2)
                            {
                                // Stops the loop - hopefully
                                findingAlternativePrefix = false

                                // Creates default calendar
                                const calendar = await createDefaultCalendar(user2.email, {name: {firstName: user2.name.firstName}})

                                // Sends an email to confirm the sign up
                                await sendSignUpConfirmation(user2.email, {
                                    confirmLink: `https://admin.booktid.net/bekraeft-email?key=${emailConfirmationKey}`,
                                    dateSent: dayjs().format('D. MMM YYYY')
                                }).catch(err => console.log(err))

                                // Sends back the newly created user
                                res.send({firstName: user2.name.firstName, email: user2.email, phoneNumber: user2.phoneNumber})

                                // Creates a test service
                                Service.create({
                                    adminEmail: user2.email,
                                    name: "Test Service",
                                    description: 'En detaljeret beskrivelse',
                                    minutesTaken: 30,
                                    breakAfter: 0,
                                    cost: 500,
                                    onlineBooking: true,
                                    elgibleCalendars: [{id: calendar.id}],
                                    allCalendars: false
                                }).catch((err) => console.log(err)) 
                            }
                            

                            if (attempt > 100) next({msg: 'Der skete en fejl'})
                        }


                        break;
                    case 'email':
                        stripe.customers.del(customer.id)
                        res.status(400)
                        return next({msg: 'E-Mail allerede i brug', stack: err.stack})
                    case 'phoneNumber':
                        stripe.customers.del(customer.id)
                        res.status(400)
                        return next({msg: 'Telefonnummer allerede i brug', stack: err.stack})
                    default:
                        return next({msg: 'Der skete en fejl, prøv venligst igen', stack: err.stack})
                }
                
            } else
            {
                console.log(err)
                // Database error
                return next({msg: 'Der skete en fejl, prøv venligst igen', stack: err.stack})
            }
        }
        else
        {
            // Creates default calendar
            const calendar = await createDefaultCalendar(user.email, {name: {firstName: user.name.firstName}})

            // Sends an email to confirm the sign up
            await sendSignUpConfirmation(user.email, {
                confirmLink: `https://admin.booktid.net/bekraeft-email?key=${emailConfirmationKey}`,
                dateSent: dayjs().format('D. MMM YYYY')
            }).catch(err => console.log(err))

            // Sends back the newly created user
            res.send({firstName: user.name.firstName, email: user.email, phoneNumber: user.phoneNumber})

            // Creates a test service
            Service.create({
                adminEmail: user.email,
                name: "Test Service",
                description: 'En detaljeret beskrivelse',
                minutesTaken: 30,
                breakAfter: 0,
                cost: 500,
                onlineBooking: true,
                elgibleCalendars: [{id: calendar.id}],
                allCalendars: false
            }).catch((err) => console.log(err))
        
        }
    })
})

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

authRouter.get('/confirm-signup/resend/:apiKey', verifyAdminKey, async (req, res, next) => {
    try {
        const client = await AdminClient.findOne({ email: req.user.email })

        const emailConfirmationKey = uniqid('BOOKTID-')

        await AdminClient.findOneAndUpdate({ email: req.user.email }, { emailConfirmationKey })
        
        await sendSignUpConfirmation(client.email, {
            confirmLink: `https://admin.booktid.net/bekraeft-email?key=${emailConfirmationKey}`,
            dateSent: dayjs().format('D. MMM YYYY')
        }).catch(err => console.log(err))

        res.send()
    } catch (err) {
        next({msg: err.message})
    }
})

authRouter.post('/login', (req, res, next) =>
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

authRouter.get('/verify-key/:apiKey', verifyAdminKey, (req, res) =>
{
    res.send(req.user)
})

module.exports = authRouter