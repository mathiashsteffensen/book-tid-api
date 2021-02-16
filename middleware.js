const {AdminClient, AdminCalendar} = require('./db/models')
const {verifyToken} = require('./utils')

const verifyAdminKey = (req, res, next) =>
{
    if (req.params.apiKey)
    {
        verifyToken(req.params.apiKey).then((payload) =>
        {
            AdminClient.findOne({email: payload.email}, (err, user) =>
            {
                if (err) res.status(401).send();
                else if (!user) res.status(401).send();
                else
                {
                    const userData = {
                        email: user.email,
                        firstName: user.name.firstName,
                        stripeCustomerID: user.stripeCustomerID,
                        subscriptionType: user.subscriptionType,
                        subscriptionTypeName: user.subscriptionTypeName,
                        currentPeriodEnd: user.currentPeriodEnd,
                        status: user.status,
                        invoiceStatus: user.invoiceStatus,
                        subscriptionID: user.subscriptionID,
                        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
                        emailConfirmed: user.emailConfirmed,
                        changingEmail: user.changingEmail,
                        changingEmailTo: user.changingEmailTo
                    }

                    req.user = userData
                    next()
                }
            })
        })
        .catch(() =>
        {
            res.status(401).send()
        })
    } else
    {
        res.status(401).send()
    }
}

// Verify calendar is specified
const verifyCalendarID = (req, res, next) =>
{
    const calendarID = req.params.calendarID
    if (calendarID)
    {
        AdminCalendar.findOne({adminEmail: req.user.email,calendarID: calendarID}, (err, calendar) =>
        {
            if (err) res.status(500).json({msg: 'Der skete en fejl prøv venligst igen'})
            if (calendar)
            {
                req.calendar = calendar
                next()
            } else
            {
                res.status(400).json({msg: 'Kalenderen kunne ikke findes'}) 
            }
        })
    } else
    {
        res.status(400).json({msg: 'Specificer venligst et kalendar ID'})
    }
}

// If calendar is optional
const fetchCalendar = async (req, res, next) =>
{
    const calendarID = req.params.calendarID
    if (calendarID !== undefined)
    {
        await AdminCalendar.findOne({adminEmail: req.user.email, calendarID: calendarID}, (err, calendar) =>
        {
            if (err) res.status(500).send()
            if (calendar)
            {
                req.calendar = calendar
            }
        })
    }
    next()
}

const errorHandler = (err, req, res, next) =>
{
    process.env.NODE_ENV === 'development' ? console.log(res.statusCode, err.msg) : null
    if (res.statusCode === 404)
    {
        res.send({
            msg: "didnt find that page, sorry bud", 
        })
    } else
    {
        const status = res.statusCode === 200 ? 500 : res.statusCode
        res.status(status).json({
            msg: err.msg ? err.msg : 'Der skete en fejl, prøv venligst igen', 
            stack: process.env.NODE_ENV === 'development' ? err.stack : "pancake"
        })
    }
}

const parseDomainPrefix = (req, res, next) =>
{
    const domainPrefix = req.params.domainPrefix

    AdminClient.findOne({'bookingSettings.domainPrefix': domainPrefix})
        .select('-cancelAtPeriodEnd -emailConfirmationKey -subscriptionID -subscriptionTypeName -paymentMethodLast4 -paymentMethodBrand -lastMonthPaid -nextMonthPay -password -status -subscriptionStart -subscriptionType -stripeCustomerID -changingEmail -bookingSettings.personalDataPolicy -currentPeriodEnd -invoiceStatus')
        .exec((err, client) => 
        {
            if (err) {console.log(err);res.status(500); res.send()}
            if (client)
            {
                req.adminEmail = client.email
                req.client = client
                next()
            } else
            { 
                req.client = null
                next()
            }
        })
}

module.exports = {
    verifyAdminKey,
    errorHandler,
    verifyCalendarID,
    fetchCalendar,
    parseDomainPrefix
}