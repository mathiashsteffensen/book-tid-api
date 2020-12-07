const express = require('express')
const { body, validationResult } = require('express-validator');

const {Customer} = require('../../db/models')
const {verifyAdminKey} = require('../../middleware')

const customerRouter = express.Router()

customerRouter.delete('/:apiKey', verifyAdminKey, async (req, res, next) =>
{
    if (req.body.customerID)
    {
        try 
        {
            let customer = await Customer.findByIdAndDelete(req.body.customerID) 
            res.json(customer)
        } catch(err)
        {
            next({msg: 'Specificer venligst et gyldigt kunde ID'})
        }
        
    } else
    {
        res.status(400)
        next({msg: 'Specificer venligst et kunde ID'})
    }
})

customerRouter.post('/create/:apiKey', verifyAdminKey, [
    body('name').isLength({min: 1}).withMessage('Indtast venligst et navn'),
    body('email').isEmail().withMessage('Indtast venligst en gyldig E-Mail')
], async function (req, res, next) {
        // Error handling
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400)
            next(errors.array()[0])
        } else
        {
            // Creates a new customer
            Customer.create({
                ...req.body,
                adminEmail: req.user.email
            }, function(err, customer)
            {
                if (err) next({msg: 'Der skete en fejl, prøv venligst igen'})
                else res.json(customer)
            })
        }

        
    })

customerRouter.post('/update/:apiKey', verifyAdminKey,  [
    body('new.name').isLength({min: 1}).withMessage('Indtast venligst et navn'),
    body('new.email').isEmail().withMessage('Indtast venligst en gyldig E-Mail')
], (req, res, next) =>
{
    // Error handling
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400)
        next(errors.array()[0]);
    } else
    {
        Customer.findByIdAndUpdate(req.body.customerID, req.body.new, function(err, customer)
        {
            if (err) next({msg: 'Der skete en fejl, prøv venligst igen'})
            else res.send(customer)
        })
    }
})

customerRouter.get('/total/:apiKey', verifyAdminKey, async (req, res) =>
{
    Customer.where({adminEmail: req.user.email}).countDocuments(function(err, result)
    {
        if (err) next({msg: 'Der skete en fejl, prøv venligst igen'})
        else 
        {
            res.json(result)
        }
    })

})

customerRouter.get('/list/search/:apiKey', verifyAdminKey, async (req, res, next) =>
{
    if (req.query.limit && req.query.offset && req.query.sortBy)
    {
        let searchTerm = req.query.searchTerm
        let limit = Number(req.query.limit)
        let offset = Number(req.query.offset)
        let sortBy = req.query.sortBy

        if (req.query.searchTerm !== undefined)
        {
            Customer.find({adminEmail: req.user.email}).or([
                {email: new RegExp(searchTerm, 'igs')}, 
                {name: new RegExp(searchTerm, 'igs')},
                {phoneNumber: new RegExp(searchTerm, 'igs')}
            ]).sort(sortBy).skip(offset).limit(limit).exec(function(err, customerList)
            {
                if (err) next({msg: 'Der skete en fejl, prøv venligst igen'})
                else res.json(customerList)
            })
        } else
        {
            try 
            {
                let customerList = await Customer.find({adminEmail: req.user.email}).sort(sortBy).skip(offset).limit(limit)
                res.json(customerList)
            } catch(err)
            {
                next({msg: 'Der skete en fejl, prøv venligst igen'})
            }
            
        }
    } else
    {
        next({msg: 'Limit, offset og sortBy er alle påkrævede felter'})
    }
    

})

module.exports = customerRouter