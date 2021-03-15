import { validationResult } from 'express-validator';

// Importing types & errors
import {
    MyRequestHandler,
    ServerError,
    BadRequestError
} from "../../types"

// Importing DayJS for working with dates
import dayjs from 'dayjs';
require('dayjs/locale/da')
dayjs.locale('da')

// Importing uniqid to create unique signup confirmation keys + SendGrid integration functions for sending confirmation emails
import uniqid from 'uniqid';

// Importing Stripe SDK
import stripe from '../../integrations/stripe';

//Importing encryption software
import { encryptPassword } from '../../utils';

// Importing DB models
import { AdminClient } from '../../db/models';

export default class AuthController {
    static signup: MyRequestHandler = async (req, res, next) => {
         // Finds the validation errors in this request and wraps them in an object with handy functions
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new BadRequestError(errors.array()[0].msg)
        }

        // Creates a stripe customer account
        const customer = await stripe.customers.create({
            email: req.body.email,
        }).catch((err: Error) => { console.log(err); throw new ServerError(err) })

        const emailConfirmationKey = uniqid('BOOKTID-')

        // Encrypting password
        req.body.password = await encryptPassword(req.body.password)
        
        // Creates the user
        const user = await AdminClient.createDefault(req.body, emailConfirmationKey, customer)

        res.json({name: user.name, email: user.email, phoneNumber: user.phoneNumber})
    }
}