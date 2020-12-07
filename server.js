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


const whitelist = ['https://admin.booktid.net', 'http://128.76.198.155']
var corsOptionsDelegate = function (req, callback) {
  const corsOptions = {
      methods: ["GET", "PUT", "POST", "DELETE", "HEAD", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true
  };

  const myIpAddress = req.connection.remoteAddress; // This is where you get the IP address from the request
  if (whitelist.indexOf(myIpAddress) !== -1 && whitelist.indexOf(req.header('Origin'))) {
      corsOptions.origin = true
  } else {
      corsOptions.origin = false
  }
  callback(null, corsOptions);
}

apiRouter.use('/admin/*', cors(corsOptionsDelegate))

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