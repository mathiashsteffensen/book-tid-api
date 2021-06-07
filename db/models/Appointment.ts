import mongoose, { Schema, Document, Model } from "mongoose"

// Importing types and errors
import {
    ServerError,
    BadRequestError
} from "../../types"

// Importing uniqid to create unique signup confirmation keys + SendGrid integration functions for sending confirmation emails
import uniqid from "uniqid";
import { sendConfirmationEmail, sendClientCancelEmail, sendNewBookingEmail } from '../../integrations/sendgrid'

// Importing DayJS for working with dates
import dayjs from "dayjs";
require("dayjs/locale/da");
dayjs.locale("da");

// Utility functions
import {
    validateNoAppointmentOverlap,
    generateCustomerCancelToken,
} from "../../utils";


const AppointmentSchema: Schema<Appointment, AppointmentModel> = new Schema({
    adminEmail: {
        type: String,
        required: true
    },
    calendarID: {
        type: String,
        required: true
    },
    customerID: {
        type: String,
        required: true
    },
    service: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    bookedOnline: {
        type: Boolean,
        required: true,
    },
    bookedAt: {
        type: Date,
        required: true
    },
    comment: {
        type: String
    },
    cancelToken: {
        type: String,
        required: true,
        unique: true
    },
    cancelled: {
        type: Boolean,
        default: false
    },
    cancelledByCustomer: Boolean,
    complete: {
        type: Boolean,
        default: false
    },
    breakAfter: {
        type: Number,
        default: 0
    }
})

export interface Appointment extends Document {
    adminEmail: string,
    calendarID: string,
    customerID: string,
    service: string,
    date: Date,
    startTime: Date,
    endTime: Date,
    bookedOnline: boolean,
    bookedAt: Date,
    comment: string,
    cancelToken: string,
    cancelled: boolean,
    cancelledByCustomer: boolean,
    complete: boolean,
    breakAfter: number
}

export interface AppointmentModel extends Model<Appointment> {
    book: (
        userInfo: {
            service: string,
            startTime: Date,
            endTime: Date,
            comment: string,
            breakAfter: number
        }, 
        calendarID: string, 
        adminEmail: string, 
        customer: {
            _id?: string,
            email: string
        }, 
        bookedOnline: boolean, 
        businessName: string,
        newBookingEmail: boolean,
        domainPrefix: string
    ) => Promise<Appointment> 
}

AppointmentSchema.statics.book = async function(
    userInfo, 
    calendarID, 
    adminEmail, 
    customer, 
    bookedOnline, 
    businessName,
    newBookingEmail,
    domainPrefix
) {
    const cancelToken = await generateCustomerCancelToken(
        customer.email
    ).catch((err) => {
        throw new ServerError(err);
    });

    const noOverlap: boolean = await validateNoAppointmentOverlap(
        adminEmail,
        calendarID,
        userInfo.startTime,
        userInfo.endTime
    ).catch((err) => {
        throw new BadRequestError(err.message);
    });

    if (!noOverlap)
        throw new BadRequestError(
            "Medarbejderen har en booking i perioden"
        );

    const defaultInfo = {
        date: dayjs.utc(userInfo.startTime).toJSON().slice(0, 10),
        customerID: customer._id,
        calendarID: calendarID,
        adminEmail: adminEmail,
        bookedOnline: bookedOnline,
        bookedAt: dayjs.utc().toJSON(),
        cancelToken: cancelToken,
    }

    const appointmentParams = {
        ...defaultInfo,
        ...userInfo
    }

    const appointment = await this.create(appointmentParams)

    sendConfirmationEmail(
        customer.email,
        {
            business:
                businessName,
            service:
                userInfo.service,
            date: dayjs
                .utc(
                    appointment.startTime
                )
                .format(
                    "HH:mm D. MMM YYYY"
                ),
            dateSent: dayjs().format(
                "DD/M YYYY"
            ),
            cancelLink: `https://${domainPrefix}.booktid.net/cancel?token=${cancelToken}`,
        }
    );

    setTimeout(() => {
        if (bookedOnline && newBookingEmail) {
            const templateData = {
                business: businessName,
                service: userInfo.service,
                customer: customer,
                    date: dayjs .utc(appointment.startTime).format("HH:mm") + dayjs.utc(appointment.endTime).format("HH:mm D/M/YYYY"),
                    dateSent: dayjs().format("DD/M YYYY"),
            }

            sendNewBookingEmail(
                adminEmail,
                templateData
            );
        }
    }, 1000);

    return appointment
}

export const Appointment = mongoose.models.Appointment as AppointmentModel || mongoose.model<Appointment, AppointmentModel>('Appointment', AppointmentSchema)
