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
                const previousApp = await TextReminderApp.findOne({adminEmail: req.user.email}).exec()

                if (previousApp) {
                    previousApp.activated = true
                    previousApp.save()
                    return res.json(previousApp)
                }

                const textReminderApp = await TextReminderApp.create({adminEmail: req.user.email}).exec()

                return res.json(textReminderApp)
            default:
                throw new Error('unknown app')
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
                const textReminderApp = await TextReminderApp.findOneAndUpdate({adminEmail: req.user.email}, {activated: false}).exec()

                return res.json(textReminderApp)
            default:
                throw new Error('unknown app')
        }
    } catch (err) {
        next({msg: err.message, stack: err.stack})
    }
})

appStoreRouter.get('/app-settings/:apiKey/:appId', verifyAdminKey, async (req, res, next) => {
    try {
        // Check if its a premium user, if not reject the request
        if (req.user.subscriptionTypeName !== 'Premium') throw new Error('Opgrader til premium for at gøre brug af BOOKTID.NETs Apps')

        // Get the settings from the DB
        switch (req.params.appId) {
            case 'textReminder':
                const textReminderApp = await TextReminderApp.findOne({adminEmail: req.user.email, activated: true}).select('-activated -adminEmail -_id -__v').exec()

                if (!textReminderApp) {
                    res.status(400)
                    throw new Error('App indstillinger kunne ikke findes')
                }

                return res.json(textReminderApp)
            default:
                throw new Error('unknown app')
        }
    } catch (err) {
        next({msg: err.message, stack: err.stack})
    }
})

appStoreRouter.patch('/app-settings/:apiKey/:appId', verifyAdminKey, async (req, res, next) => {
    try {
        // Check if its a premium user, if not reject the request
        if (req.user.subscriptionTypeName !== 'Premium') throw new Error('Opgrader til premium for at gøre brug af BOOKTID.NETs Apps')

        // Get the settings from the DB
        switch (req.params.appId) {
            case 'textReminder':
                const textReminderApp = await TextReminderApp.findOneAndUpdate({adminEmail: req.user.email, activated: true}, { 
                    remindAt: req.body.remindAt,
                    sendReminders: req.body.sendReminders
                 }).exec()

                 console.log(textReminderApp);

                if (!textReminderApp) {
                    res.status(400)
                    throw new Error('App indstillinger kunne ikke findes')
                }

                return res.json(textReminderApp)
            default:
                throw new Error('unknown app')
        }
    } catch (err) {
        next({msg: err.message, stack: err.stack})
    }
})

module.exports = appStoreRouter