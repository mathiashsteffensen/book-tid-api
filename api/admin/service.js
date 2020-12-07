const express = require('express')
const { body, validationResult } = require('express-validator');

const {
    Service,
    ServiceCategory
} = require('../../db/models')

const {verifyAdminKey} = require('../../middleware')

const serviceRouter = express.Router()

// Routes for categories
serviceRouter.post('/create-category/:apiKey', verifyAdminKey, 
body('name').exists().isLength({min: 1}).withMessage('Giv venligst kategorien et navn'),
(req, res, next) =>
{
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400)
        return next(errors.array()[0]);
    }

    ServiceCategory.find({
        name: req.body.name,
        adminEmail: req.user.email
    }, function(err, categories)
    {
        if (err) next({msg: 'Der skete en fejl, prøv venligst igen'})
        else if (!categories[0]){
            ServiceCategory.create({
                name: req.body.name,
                adminEmail: req.user.email
            }, function(err, category)
            {
                if (err) next({msg: 'Der skete en fejl, prøv venligst igen'})
                else res.json(category)
            })
        } else 
        {
            res.status(400)
            next({msg: 'Der eksisterer allerede en kategori med navnet'})
        }
    })
})

serviceRouter.post('/update-category/:apiKey', verifyAdminKey, 
body('name').exists().isLength({min: 1}).withMessage('Specificer venligst en opdatering'),
body('id').exists().isLength({min: 1}).withMessage('Specificer venligst en kategori at opdaterer'),
(req, res, next) =>
{
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400)
        return next(errors.array()[0]);
    }

    ServiceCategory.find({
        name: req.body.name,
        adminEmail: req.user.email
    }, function(err, categories)
    {
        if (err) next({msg: 'Der skete en fejl, prøv venligst igen'})
        else if (!categories[0]){
            ServiceCategory.findByIdAndUpdate(req.body.id, {name: req.body.name}, async function(err, category)
            {
                if (err) next({msg: 'Der skete en fejl, prøv venligst igen'}) 
                else 
                {
                    let servicesToUpdate = await Service.find({categoryName: category.name}).exec()

                    servicesToUpdate.forEach((serviceToUpdate) =>
                    {
                        serviceToUpdate.updateOne({categoryName: req.body.name}).exec()
                    })
                    res.json(category)
                }
            })
        } else
        {
            res.status(400)
            next({msg: 'Der eksisterer allerede en kategori med navnet'})
        }
    })
})

serviceRouter.get('/categories/:apiKey', verifyAdminKey, (req, res, next) =>
{
    ServiceCategory.find({
        adminEmail: req.user.email
    }, function(err, categories)
    {
        if (err) next({msg: 'Der skete en fejl, prøv venligst igen'}) 
        else res.json(categories)
    })
})

serviceRouter.delete('/category/:apiKey', verifyAdminKey,
body('id').isLength({min: 1}).withMessage('Specificer venligst en kategori at slette'),
(req, res, next) =>
{
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400)
        return next(errors.array()[0]);
    }

    // Deletes category
    ServiceCategory.findByIdAndDelete(req.body.id, function(err, category)
    {
        if (err) next({msg: 'Der skete en fejl, prøv venligst igen'}) 
        else res.send()
    })
})

// Routes for the actual services
serviceRouter.post('/create-service/:apiKey', verifyAdminKey,
body('name').exists().isLength({min: 1}).withMessage('Giv venligst servicen et navn'),
body('minutesTaken').exists().isNumeric().withMessage('Specificer venligst hvor langt tid servicen tager'),
body('onlineBooking').exists().isBoolean().withMessage('Specificer venligst om online booking bør være muligt'),
(req, res, next) =>
{
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400)
        return next(errors.array()[0]);
    }

    // Creates the service
    Service.create({
        ...req.body,
        ...{adminEmail: req.user.email}
    }, function(err, service)
    {
        if (err) next({msg: 'Der skete en fejl prøv venligst igen'})
        else res.json(service)
    })
})

serviceRouter.post('/update-service/:apiKey', verifyAdminKey,
body('new.name').exists().isLength({min: 1}).withMessage('Giv venligst servicen et navn'),
body('new.minutesTaken').exists().isNumeric().withMessage('Specificer venligst hvor langt tid servicen tager'),
body('new.onlineBooking').exists().isBoolean().withMessage('Specificer venligst om online booking bør være muligt'),
(req, res, next) =>
{
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400)
        return next(errors.array()[0]);
    }

    Service.findByIdAndUpdate(req.body.serviceID, req.body.new, function(err, service)
    {
        if (err) next({msg: 'Der skete en fejl, prøv venligst igen'})
        else res.json(service)
    })
})

serviceRouter.get('/services/:apiKey', verifyAdminKey, (req, res, next) =>
{
    Service.find({
        adminEmail: req.user.email
    }, function(err, services)
    {
        if (err) next({msg: 'Der skete en fejl, prøv venligst igen'})
        else res.json(services)
    })
})

serviceRouter.delete('/:apiKey', verifyAdminKey, (req, res, next) =>
{
    if (req.body.serviceID)
    {
        Service.findByIdAndDelete(req.body.serviceID, function(err, service)
        {
            if (err) next({msg: 'Der skete en fejl, prøv venligst igen'})
            else res.send()
        })    
    } else
    {
        res.status(400)
        next({msg: 'Specificer venligst et service ID'})
    }
    
})

module.exports = serviceRouter