// Importing uniqid to create unique signup confirmation keys + SendGrid integration functions for sending confirmation emails
import uniqid from 'uniqid'
import { sendNewEmailConfirmation } from '../../integrations/sendgrid'

// Importing Dayjs for working with dates
import dayjs from "dayjs"

// Importing types
import {
    MyRequestHandler,
    ServerError,
    UnauthorizedError,
    BadRequestError,
} from "../../types";

// Importing DB models
import { AdminClient } from "../../db/models";

export default class SettingsController {
    static getBooking: MyRequestHandler = async (req, res) => {
        if (!req.user) throw new UnauthorizedError("Unauthorized");

        const client = await AdminClient.findOne({ email: req.user.email })
            .select("bookingSettings")
            .catch((err: any) => {
                throw new ServerError(err);
            });

        if (!client) throw new UnauthorizedError("Unauthorized");

        res.send(client.bookingSettings);
    };

    static updateBooking: MyRequestHandler = async (req, res) => {
        if (!req.user) throw new UnauthorizedError("Unauthorized");

        let client;

        if (req.body.domainPrefix)
            client = await AdminClient.findOne({
                "bookingSettings.domainPrefix": req.body.domainPrefix,
            }).catch((err: any) => {
                throw new ServerError(err);
            });

        if (client && client.email !== req.user.email)
            throw new BadRequestError("Domæne navn er allerede i brug");

        client = await AdminClient.findOneAndUpdate(
            { email: req.user.email },
            { bookingSettings: req.body }
        ).catch((err: any) => {
            throw new ServerError(err);
        });

        res.json(client?.bookingSettings);
    };

    static getProfile: MyRequestHandler = async (req, res) => {
        if (!req.user) throw new UnauthorizedError("Unauthorized");

        const client = await AdminClient.findOne({ email: req.user.email })
            .select(
                "name email phoneNumber currentPeriodEnd businessInfo subscriptionType lastMonthPaid nextMonthPay maxNumberOfCalendars"
            )
            .exec();

        res.json(client);
    };

    static updateProfile: MyRequestHandler = async (req, res) => {
        if (!req.user) throw new UnauthorizedError("Unauthorized");

        const {
            name,
            email,
            phoneNumber,
            businessInfo
        } = req.body
    
        if (email.toLowerCase() !== req.user.email) {

            const userWithNewEmail = await AdminClient.findOne( { email } ).exec() 
    
            if (userWithNewEmail) throw new BadRequestError('E-Mail allerede i brug')
    
            const emailConfirmationKey = uniqid('BOOKTID-')
    
            await AdminClient.findOneAndUpdate( { email: req.user.email }, {
                changingEmail: true,
                changingEmailTo: email,
                emailConfirmationKey
            } ).exec()
    
            await sendNewEmailConfirmation(req.user.email, {
                confirmLink: `https://admin.booktid.net/bekraeft-email?key=${emailConfirmationKey}`,
                dateSent: dayjs().format('D. MMM YYYY'),
                newEmail: email
            }).catch(err => console.log(err))
        }
    
        await AdminClient.findOneAndUpdate( { email: req.user.email }, {
            name,
            phoneNumber,
            businessInfo
        } ).exec()
    
        res.send()
    };
}
