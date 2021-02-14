const express = require('express')
const dayjs = require('dayjs')

// Importing uniqid to create unique signup confirmation keys + SendGrid integration functions for sending confirmation emails
const uniqid = require('uniqid')
const { sendNewEmailConfirmation } = require('../../integrations/sendgrid')

// Importing DB models
const { AdminClient } = require('../../db/models')
const { verifyAdminKey } = require('../../middleware')

const settingsRouter = express.Router()

settingsRouter.get('/booking/:apiKey', verifyAdminKey, (req, res, next) =>
{
    AdminClient.findOne({email: req.user.email}).select('bookingSettings').exec((err, client) =>
    {
        console.log(client.bookingSettings);
        if (err) next()
        else res.send(client.bookingSettings)
    })
})

settingsRouter.post('/booking/:apiKey', verifyAdminKey, async (req, res, next) =>
{
    if (req.body.domainPrefix) await AdminClient.findOne({bookingSettings: {domainPrefix: req.body.domainPrefix}}).exec((err, client) =>
    {
        if (err) next()
        if (client && client.email !== req.user.email) {res.status(400); next({msg: 'Domæne navn er allerede i brug'})}
    })

    await AdminClient.findOneAndUpdate({email: req.user.email}, {bookingSettings: req.body}).exec((err, client) =>
    {
        if (err) next()
        res.send()
    })
})

settingsRouter.get('/profile/:apiKey', verifyAdminKey, async (req, res, next) =>
{
    const client = await AdminClient.findOne({email: req.user.email}).select('name email phoneNumber businessInfo subscriptionType lastMonthPaid nextMonthPay maxNumberOfCalendars').exec()
    res.json(client)
})

settingsRouter.post('/profile/:apiKey', verifyAdminKey, async (req, res, next) => {
    const {
        name,
        email,
        phoneNumber,
        businessInfo
    } = req.body

    if (email.toLowerCase() !== req.user.email.toLowerCase()) {
        console.log('changing email')
        const userWithNewEmail = await AdminClient.findOne( { email } ).exec() 

        if (userWithNewEmail) {
            res.status(400)
            return next({msg: 'E-Mail allerede i brug'})
        }

        const emailConfirmationKey = uniqid('BOOKTID-')

        await AdminClient.findOneAndUpdate( { email: req.user.email }, {
            changingEmail: true,
            changingEmailTo: email,
            emailConfirmationKey
        } ).exec()

        await sendNewEmailConfirmation(req.user.email, {
            confirmLink: `https://admin.booktid.net/bekraeft-email?key=${emailConfirmationKey}`,
            dateSent: dayjs().format('D. MMM YYYY'),
            newEmail: email
        }).catch(err => console.log(err))
    }

    await AdminClient.findOneAndUpdate( { email: req.user.email }, {
        name,
        phoneNumber,
        businessInfo
    } ).exec()

    res.send()
    
})

module.exports = settingsRouter