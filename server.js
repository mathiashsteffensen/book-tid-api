const env = process.env.NODE_ENV

require('dotenv').config()

// Importing Express + relevant middleware
const express = require('express');
const server = express();
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');

// Importing routes
const apiRouter = require('./api/api');

// Security middleware enabled in production
env === 'production' && server.use(helmet())

// Data parsing middleware
// Use JSON parser for all non-webhook routes
server.use((req, res, next) => {
    if (req.originalUrl === '/admin/pay/stripe-webhook') {
      next();
    } else {
      express.json()(req, res, next);
    }
  });
server.use(express.urlencoded({extended: true}))
server.use(cookieParser())

// Logging middleware
env !== 'test' && server.use(morgan('dev'))

// cross-origin middleware
env === "development" ? apiRouter.use('/admin/*', cors({
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200,
})) : apiRouter.use('/admin/*', cors({
    origin: 'https://admin.booktid.net',
    optionsSuccessStatus: 200,
}))

apiRouter.use('/client/*', cors())
server.use(apiRouter)
// Importing database and initializing server when connection is ready
const db = require('./db/db');

db.on('error', console.error.bind(console, 'connection error:'));
env !== 'test' && db.once('open', () => {
    console.log('Connected to database');

    server.use(express.static('public'))

    // 404
    server.use('*', (req, res) =>
    {
        res.status(404)
        res.send('Unknown endpoint')
    })

    server.listen(process.env.PORT, () => {
        console.log(`Listening on PORT ${process.env.PORT}`);
    })
})

module.exports = server