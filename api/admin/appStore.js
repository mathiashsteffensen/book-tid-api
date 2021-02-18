const express = require('express')

const { verifyAdminKey } = require('../../middleware')

const {
    AdminClient,
    TextReminderApp
} = require('../../db/models')

const appStoreRouter = express.Router()

appStoreRouter.post('/activate-app/:apiKey', verifyAdminKey, async (req, res, next) => {
    try {
        // Check if its a premium user, if not reject the request
        if (req.user.subscriptionTypeName !== 'Premium') throw new Error('Opgrader til premium for at gøre brug af BOOKTID.NETs Apps')

        // Check if an app to activate is provided
        if ( !req.body.app || !req.body.app.id) throw new Error('Specificer venligst en app at aktivere')

        // Save the app as activated on the user
        await AdminClient.findOneAndUpdate({ email: req.user.email }, {
            $push: {
                activatedApps: req.body.app.id
            }
        })

        // Check if the app has been previously used, if so reactivate old DB instance, otherwise create a DB Instance for the App data to use
        switch (req.body.app.id) {
            case 'textReminder':
                const previousApp = await TextReminderApp.findOne({adminEmail: req.user.email})

                if (previousApp) return res.json(previousApp)

                const textReminderApp = await TextReminderApp.create({adminEmail: req.user.email})

                return res.json(textReminderApp)
            default:
                throw new Error('unkown app')
        }
    } catch (err) {
        next({msg: err.message, stack: err.stack})
    }
})

appStoreRouter.post('/deactivate-app/:apiKey', verifyAdminKey, async (req, res, next) => {
    try {
        // Check if its a premium user, if not reject the request
        if (req.user.subscriptionTypeName !== 'Premium') throw new Error('Opgrader til premium for at gøre brug af BOOKTID.NETs Apps')

        // Check if an app to deactivate is provided
        if ( !req.body.app || !req.body.app.id) throw new Error('Specificer venligst en app at deaktivere')

        // Remove the app from the list of activated apps on the user
        await AdminClient.findOneAndUpdate({ email: req.user.email }, {
            $pull: {
                activatedApps: req.body.app.id
            }
        })

        // Deactivate the Apps DB instance for later use
        switch (req.body.app.id) {
            case 'textReminder':
                const textReminderApp = await TextReminderApp.findOneAndUpdate({adminEmail: req.user.email}, {activated: false})

                return res.json(textReminderApp)
            default:
                throw new Error('unkown app')
        }
    } catch (err) {
        next({msg: err.message, stack: err.stack})
    }
})

module.exports = appStoreRouter