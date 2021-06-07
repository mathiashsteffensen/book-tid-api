const env = process.env.NODE_ENV

import dotenv from "dotenv"
dotenv.config()

// Importing Express + relevant middleware
import express from 'express'
const server = express();
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

// Importing routes
import apiRouter from './routes/api';

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
import db from './db/db';

db.on('error', console.error.bind(console, 'connection error:'));
env !== 'test' && db.once('open', () => {
    console.log('Connected to database');

    server.use(express.static('public'));

    const port = process.env.PORT || 4000

    server.listen(port, () => {
        console.log(`Listening on PORT ${port}`);
    })
})

export default server
