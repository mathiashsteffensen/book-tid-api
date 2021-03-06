const env = process.env.NODE_ENV

require('dotenv').config()

// Importing Express + relevant middleware
import express from 'express'
const server = express();
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
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

// Mounting API to the server
server.use(apiRouter)

// Health check for the AWS Load Balancer
server.use('/health', (req, res, next) => {
  res.send('Ay Okay')
})

// Importing database and initializing server when connection is ready
const db = require('./db/db');

db.on('error', console.error.bind(console, 'connection error:'));
env !== 'test' && db.once('open', () => {
    console.log('Connected to database');

    server.use(express.static('public'));

    server.listen(process.env.PORT, () => {
        console.log(`Listening on PORT ${process.env.PORT}`);
    })
})

module.exports = server
export default server