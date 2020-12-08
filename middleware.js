const jwt = require('jsonwebtoken')
const dayjs = require('dayjs')
const secret = process.env.JWT_SECRET
const {AdminClient, AdminCalendar} = require('./db/models')
const {verifyToken, getCatsAndServices} = require('./utils')

var validateToken = function (req, res, next) {
    jwt.verify(req.body.token, secret, (err, payload) =>
    {
        if (err) res.redirect('http://localhost:3000/auth/login')
        else if (!payload) res.redirect('http://localhost:3000/auth/login')
        else 
        {
            AdminClient.find({email: payload.email, password: payload.password}, function(err, user)
            {
                if (err) res.redirect('http://localhost:3000/auth/login')
                else 
                {
                    if (user.length === 0)
                    {
                        res.redirect('http://localhost:3000/auth/login')
                    } else
                    {
                        req.email = payload.email
                        req.name = user[0].name.firstName
                        next()
                    }
                }
            })
        }
    })
}

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
                    req.user = payload
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

const handleNotFound = (req, res, next) =>
{
    res.status(404).send("didnt find that page, sorry bud")
}

const renderFrontEndBooking = (req, res) =>
{
    AdminClient.findOne({"bookingSettings.domainPrefix": req.subdomain}).select('-bookingSettings.personalDataPolicy').exec(async (err, client) => 
    {
        if (err) {console.log(err); res.render('500')}
        else if(!client) res.render('404')
        else 
        {
            const catsAndServices = await getCatsAndServices(client.email)
            const endDate = dayjs().add(client.bookingSettings.maxDaysBookAhead, 'days').format('DD/MM/YYYY')
            const startDate = dayjs().format('DD/MM/YYYY')
            console.log(client)
            const publicClientInfo = {
                bookingSettings: client.bookingSettings,
                businessInfo: client.businessInfo,
            }
            res.render('booking', {catsAndServices, endDate, startDate, subdomain: req.subdomain, a_client: publicClientInfo})
        }
    })
    
}

const parseDomainPrefix = async (req, res, next) =>
{
    const domainPrefix = req.params.domainPrefix
    const client = await AdminClient.findOne({'bookingSettings.domainPrefix': domainPrefix}).select('-password -status -subscriptionStart -subscriptionType -stripeCustomerID -name -bookingSettings.personalDataPolicy').exec().catch(err => {res.status(500); res.send()})
    req.adminEmail = client.email
    req.client = client
    next()
}

module.exports = {
    validateToken,
    verifyAdminKey,
    errorHandler,
    handleNotFound,
    verifyCalendarID,
    fetchCalendar,
    renderFrontEndBooking,
    parseDomainPrefix
}