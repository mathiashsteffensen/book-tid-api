// Importing express & express-validator
const express = require('express')
const { body, validationResult } = require('express-validator');

// Importing Stripe SDK
const stripe = require('../../stripe')

//Importing encryption software
const {
    encryptPassword,
    verifyPassword,
    createToken
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

    // Info that isnt customizable, this is signup for a free account only
    let defaultInfo = {
        bookingSettings: {domainPrefix: req.body.businessInfo.name.split(' ').join('').toLowerCase()},
        subscriptionType: 'free',
        subscriptionStart: Date.now(),
        maxNumberOfCalendars: 1,
        stripeCustomerID: customer.id,
        status: 'active'
    }


    // Encrypting password
    req.body.password = await encryptPassword(req.body.password)
    
    // Merging user info with default info
    let userInfo = {
        ...req.body,
        ...defaultInfo
    }

    // Creates the user
    await AdminClient.create(userInfo, async function(err, user)
    {
        if (err) {
            if (err.code === 11000)
            {
                // If a user is already registered
                stripe.customers.del(customer.id)
                res.status(400)
                return next({msg: 'E-Mail eller telefonnummer allerede i brug', stack: err.stack})
            } else
            {
                // Database error
                return next({msg: 'Der skete en fejl, prøv venligst igen', stack: err.stack})
            }
        }
        else
        {
            // Creates default calendar
            const calendar = await createDefaultCalendar(user.email, {name: {firstName: user.name.firstName}})
            console.log(calendar)
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
            }).exec().catch((err) => console.log(err))
        
        }
    })
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

authRouter.post('/createSubscription/:apiKey', verifyAdminKey, async (req, res, next) =>
{
    // Set the default payment method on the customer
  try {
    await stripe.paymentMethods.attach(req.body.paymentMethodId, {
      customer: req.body.customerId,
    });
  } catch (error) {
    res.status(402)
    return next({msg: error.message})
  }

  await stripe.customers.update(
    req.body.customerId,
    {
      "invoice_settings": {
        "default_payment_method": req.body.paymentMethodId,
      },
    }
  );

  // Create the subscription
  const subscription = await stripe.subscriptions.create({
    customer: req.body.customerId,
    items: [
      { price: req.body.priceId, quantity: req.body.quantity },
    ],
    expand: ['latest_invoice.payment_intent', 'plan.product'],
  });

  // Saves the necessary subscription information to the database
  AdminClient.findOneAndUpdate({stripeCustomerID: req.body.customerId}, {
      subscriptionID: subscription.id,
      currentPeriodEnd: subscription["current_period_end"],
      status: subscription.status,
      maxNumberOfCalendars: subscription.quantity
  })

  res.send(subscription);
})

authRouter.get('/verify-key/:apiKey', verifyAdminKey, (req, res) =>
{
    res.send(req.user)
})

module.exports = authRouter