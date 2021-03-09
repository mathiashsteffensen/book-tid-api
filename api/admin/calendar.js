const express = require('express')
const { body, validationResult } = require('express-validator');
const {
    createDefaultCalendar 
} = require('../../db/queries')

const {
    AdminCalendar,
    AdminClient
} = require('../../db/models')

const {verifyAdminKey} = require('../../middleware')

const {upload, remove} = require('../../integrations/aws')

const calendarRouter = express.Router()

calendarRouter.get('/max-allowed/:apiKey', verifyAdminKey, async (req, res, next) =>
{
    try
    {
        let max = await AdminClient.findOne({email: req.user.email}).select('maxNumberOfCalendars')
        res.json(max.maxNumberOfCalendars)
    } catch (err)
    {
        next({msg: 'Der skete en fejl, prøv venligst igen'})
    }
    
})

calendarRouter.get('/all/:apiKey', verifyAdminKey, (req, res, next) =>
{
    AdminCalendar.find({adminEmail: req.user.email}, function(err, calendars)
    {
        if (err) next({msg: 'Der skete en fejl, prøv venligst igen'})
        res.json(calendars)
    })
})

calendarRouter.get('/by-id/:apiKey/:calendarID', verifyAdminKey, (req, res, next) =>
{
    AdminCalendar.findOne({adminEmail: req.user.email, calendarID: req.params.calendarID}, (err, calendar) =>
    {
        if (err) next({msg: 'Der skete en fejl, prøv venligst igen'})
        else if (calendar) res.json(calendar)
        else
        {
            res.status(400)
            next({msg: 'Ingen kalender fundet med dette kalender ID'})
        }
    })
})

calendarRouter.post('/create/:apiKey', verifyAdminKey, async (req, res, next) =>
{
    try
    {
        let calendarID = await createDefaultCalendar(req.user.email, {name: {firstName: req.user.firstName}})
        res.json(calendarID)
    } catch(err)
    {
        next({msg: err.message})
    }
})

calendarRouter.post('/update/:apiKey', verifyAdminKey, (req, res, next) =>
{
    if (req.body.calendarID)
    {
        console.log(req.body.new.schedule.specialWeek[0].schedule[3])
        AdminCalendar.findOneAndUpdate({adminEmail: req.user.email, calendarID: req.body.calendarID}, req.body.new, function(err, calendar)
        {
            if (err) next({msg: 'Der skete en fejl, prøv venligst igen'})
            else 
            {
                res.json(calendar)
            }
        })
    } else
    {
        res.status(400)
        next({msg: 'Specificer venligst et gyldigt kalender ID'})
    }
   
})

calendarRouter.delete('/:apiKey', verifyAdminKey, async (req, res, next) =>
{
    if (req.body.calendarID)
    {
        await AdminCalendar.findOneAndDelete({
            adminEmail: req.user.email,
            calendarID: req.body.calendarID
        }, function(err, calendar)
        {
            if (err) next({msg: 'Der skete en fejl, prøv venligst igen'})
            else res.json(calendar)
        }) 
    } else
    {
        res.status(400)
        next({msg: 'Specificer venligst et gyldigt kalender ID'})
    }
})


// Add options for seeing all uploaded pictures + deletion options to not overflow db - also add filesize validation for this purpose
// Read up on the Amazon S3 SDK ...
calendarRouter.post('/upload-avatar/:apiKey/:calendarID', verifyAdminKey, (req, res, next) =>
{
        upload.single('avatar')(req, res, err =>
        {
            if (err) 
            {
                res.status(400)
                next({msg: err.message})
            }
            else
            {
                if (req.file)
                {
                    AdminCalendar.findOneAndUpdate({
                        adminEmail: req.user.email, 
                        calendarID: req.params.calendarID}, {pictureURL: req.file.location}, function(error, calendar)
                    {
                        if (error) next({msg: 'Der skete en fejl, prøv venligst igen'})
                        else 
                        {
                            AdminClient.findOne({email: req.user.email}, (err, client) =>
                            {
                                if (err) next();
                                else
                                {
                                    let pictureURLs = [...client.pictureURLs, ...[req.file.location]]
                                    client.updateOne({pictureURLs: pictureURLs}, (err) =>
                                    {
                                        if (err) next();
                                        else res.json({...calendar, ...{pictureURL: req.file.location}})
                                    })
                                }
                            })
                        }
                    })
                } else
                {
                    res.status(400)
                    next({msg: 'Vælg venligst et billede at uploade'})
                }
            }
        })  
})

calendarRouter.get('/avatars/:apiKey', verifyAdminKey, (req, res, next) =>
{
    AdminClient.findOne({email: req.user.email}).select('pictureURLs').exec((err, client) =>
    {
        if (err) next()
        res.json(client.pictureURLs)
    })
})

calendarRouter.delete('/avatar/:apiKey', verifyAdminKey, (req, res, next) =>
{
    remove(req.body.pictureURL).then(() => 
    {
        AdminClient.findOne({email: req.user.email}, (err, client) =>
        {
            if (err) next()
            else
            {
                let pictureURLs = client.pictureURLs.filter((url) =>
                {
                    if (url === req.body.pictureURL) return false
                    else return true
                })
                AdminCalendar.find({adminEmail: req.user.email, pictureURL: req.body.pictureURL}, (err, calendars) =>
                {
                    calendars.forEach((calendar) =>
                    {
                        calendar.updateOne({pictureURL: 'https://booktiddb.ams3.digitaloceanspaces.com/default-profile.png'}).exec()
                    })
                })
                client.updateOne({pictureURLs: pictureURLs}, (err) =>
                {
                    if (err) next()
                    else res.send()
                })
            }
        })
    }).catch((err) => next({msg: err.message}))
})


module.exports = calendarRouter