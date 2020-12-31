const express = require('express')

// Importing DB models
const { AdminClient } = require('../../db/models')
const { verifyAdminKey } = require('../../middleware')

const settingsRouter = express.Router()

settingsRouter.get('/booking/:apiKey', verifyAdminKey, (req, res, next) =>
{
    AdminClient.findOne({email: req.user.email}).select('bookingSettings').exec((err, client) =>
    {
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
    const client = await AdminClient.findOne({email: req.user.email}).select('-bookingSettings -password -pictureURLs').exec()
    res.json(client)
})

module.exports = settingsRouter