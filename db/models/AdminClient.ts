// Importing mongoose for interfacing with MongoDB Shell
import mongoose, { Schema, Document, Model, Date } from "mongoose";

// Library for working with dates
import dayjs from "dayjs";
require("dayjs/locale/da");
dayjs.locale("da");

import { createBookingDomain } from "../../utils";
import { createDefaultCalendar } from "../queries";

import { Service } from "./models";

// Importing Errors
import { BadRequestError, ServerError } from "../../types";

// Integration imports
import stripe from "../../integrations/stripe";
import { sendSignUpConfirmation } from "../../integrations/sendgrid";
import { resolve } from "node:path";

/*** Create Schemas ***/

export interface BookingSettings extends Document<any> {
    domainPrefix: string;
    latestBookingBefore: number;
    latestCancelBefore: number;
    maxDaysBookAhead: number;
    newBookingEmail: boolean;
    cancelBookingEmail: boolean;
    requireCustomerAddress: boolean;
    hideCustomerCommentSection: boolean;
    hideServiceDuration: boolean;
    hideServicePrice: boolean;
    hideContactInfo: boolean;
    hideGoogleMaps: boolean;
    personalDataPolicy: {
        personalData: string;
        agreementDeclaration: string;
    };
}

// BookingSettingsSchema
const BookingSettingsSchema: Schema<BookingSettings> = new Schema({
    domainPrefix: {
        type: String,
        unique: true,
    },
    latestBookingBefore: {
        type: Number,
        default: 60,
    },
    latestCancelBefore: {
        type: Number,
        default: 720,
    },
    maxDaysBookAhead: {
        type: Number,
        default: 1092,
    },
    newBookingEmail: {
        type: Boolean,
        default: true,
    },
    cancelBookingEmail: {
        type: Boolean,
        default: true,
    },
    requireCustomerAddress: {
        type: Boolean,
        default: false,
    },
    hideCustomerCommentSection: {
        type: Boolean,
        default: false,
    },
    hideServiceDuration: {
        type: Boolean,
        default: false,
    },
    hideServicePrice: {
        type: Boolean,
        default: false,
    },
    hideContactInfo: {
        type: Boolean,
        default: false,
    },
    hideGoogleMaps: {
        type: Boolean,
        default: true,
    },
    personalDataPolicy: {
        personalData: {
            type: String,
            default: `
                Når du er kunde hos mig, indsamler jeg data om dig. Det betyder, at jeg er dataansvarlig og dermed ansvarlig for at informationer om dig håndteres korrekt og sikkert.
                
                Data vil aldrig blive videregivet til 3. part eller blive brugt i andre sammenhænge end herunder listet.
                
                De persondata, jeg gemmer, når du er kunde hos mig, er følgende:
                
                - Fornavn og efternavn
                - Adresse og by
                - Email-adresse
                - Telefonnummer
                - Aftaler om services
                - Billeder
                
                Årsagen, til jeg skal gemme disse data, er følgende:
                
                - For at kunne indgå en aftale med dig og gemme aftalen i min kalender
                - For at kunne udsende påmindelser og bekræftelser på vores aftale
                - For at kunne oprette en faktura til dig
                - For at kunne se dine tidligere og fremtidige aftaler, således at jeg kan yde den bedst mulige service
                
                Jeg gemmer dine oplysninger, indtil du ønsker dem ændret, slettet, ønsker at trække samtykket tilbage - eller efter 10 år fra din sidste aktivitet.
                
                Du kan til enhver tid ændre eller slette dine data hos mig. Dog vil data tilknyttet faktura være gemt i systemet jf. ovenstående. Du ændrer eller sletter dine data eller trækker samtykket tilbage ved at benytte knappen “Ret min profil” på min bookingside.
                
                Ønsker du at få dine data udleveret, kan dette ske ved at rette henvendelse til mig.
                
                Kundens persondata og personfølsomme data kan på forlangende af kunden, sendes til kunden eller en dataansvarlig i en anden virksomhed. Formatet vil være JSON.
                Anmodningen skal være afsendt fra kundens egen email-adresse til service@booktid.net.
                
                Kunders journaler og andre personfølsomme data er krypteret med TLS/SHA-256. 
                Vi benytter SSL / Https-sikkerhed.
                
                Har du spørgsmål til min håndtering af data, kan du altid kontakte mig, og for god ordens skyld skal jeg nævne at du også har mulighed for at klage til Datatilsynet.
            `,
        },
        agreementDeclaration: {
            type: String,
            default: `
                Når du er kunde hos mig, indsamler jeg data om dig. Det betyder, at jeg er dataansvarlig og dermed ansvarlig for at informationer om dig håndteres korrekt og sikkert.

                De data, jeg gemmer, er dine kontaktinformationer og info om de services, du booker hos mig.

                Når du giver samtykke til, at jeg må indsamle og anvende disse data, er det for, at jeg kan yde den bedst mulige service.

                Jeg gemmer dine oplysninger, indtil du ønsker dem ændret, slettet, ønsker at trække samtykket tilbage - eller efter 10 år fra din sidste aktivitet.

                Vær desuden opmærksom på, at du ikke kan acceptere samtykkeerklæringen, hvis du er under 16 år. Her skal samtykkes accepteres af en værge eller en forældre.

                Jeg glæder mig til at se dig.
            `,
        },
    },
});

// Admin Client Schema - schema for registered users of the admin client
const AdminClientSchema: Schema<AdminClient, AdminClientModel> = new Schema({
    name: {
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
        },
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    emailConfirmed: {
        type: Boolean,
        default: false,
    },
    changingEmail: {
        type: Boolean,
        default: false,
    },
    changingEmailTo: {
        type: String,
    },
    emailConfirmationKey: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    pictureURLs: [
        {
            type: String,
        },
    ],
    businessInfo: {
        name: {
            type: String,
            required: true,
        },
        address: {
            city: {
                type: String,
            },
            postcode: {
                type: String,
            },
            street: {
                type: String,
            },
            number: {
                type: String,
            },
        },
    },
    bookingSettings: BookingSettingsSchema,
    subscriptionType: {
        type: String,
        required: true,
    },
    subscriptionStart: {
        type: Schema.Types.Date,
        required: true,
    },
    maxNumberOfCalendars: {
        type: Number,
        default: 1,
    },
    stripeCustomerID: String,
    subscriptionID: String,
    subscriptionTypeName: String,
    currentPeriodEnd: Schema.Types.Date,
    cancelAtPeriodEnd: {
        type: Boolean,
        default: false,
    },
    lastMonthPaid: Number,
    nextMonthPay: Number,
    status: {
        type: String,
        required: true,
    },
    invoiceStatus: {
        type: String,
    },
    paymentMethodBrand: String,
    paymentMethodLast4: String,
    activatedApps: [String],
});

AdminClientSchema.statics.createDefault = async function (
    userInfo,
    emailConfirmationKey,
    stripeCustomer
) {
    const defaultInfo = {
        bookingSettings: {
            domainPrefix: createBookingDomain(userInfo.businessInfo.name),
        },
        subscriptionType: "free",
        subscriptionStart: dayjs().toISOString(),
        maxNumberOfCalendars: 1,
        stripeCustomerID: stripeCustomer.id,
        status: "active",
        emailConfirmationKey,
    };

    // Merging user info with default info
    const signupParams = {
        ...userInfo,
        ...defaultInfo,
    };

    const user = await this.create(signupParams).catch(async (err: any) => {
        if (err.code === 11000) {
            // Handle duplication errors
            const errorKey = Object.keys(err.keyValue)[0];

            switch (errorKey) {
                case "bookingSettings.domainPrefix":
                    let findingAlternativePrefix = true;

                    for (let attempt = 1; findingAlternativePrefix; attempt++) {
                        defaultInfo.bookingSettings.domainPrefix = createBookingDomain(
                            userInfo.businessInfo.name + attempt
                        );
                        const user = await AdminClient.create(
                            signupParams
                        ).catch(() => {});

                        if (user) {
                            // Stops the loop - hopefully
                            findingAlternativePrefix = false;

                            // User Has been created
                            return user;
                        }

                        if (attempt > 100)
                            throw new ServerError(new Error("error"));
                    }
                    break;

                case "email":
                    stripe.customers.del(stripeCustomer.id);
                    throw new BadRequestError(
                        "E-Mail allerede i brug",
                        err.stack
                    );

                case "phoneNumber":
                    stripe.customers.del(stripeCustomer.id);
                    throw new BadRequestError(
                        "Telefonnummer allerede i brug",
                        err.stack
                    );

                default:
                    throw new ServerError(err);
            }
        } else throw new ServerError(err)
    });
    if (!user) throw new ServerError(new Error())

    // Creates default calendar
    await createDefaultCalendar(user.email, {
        name: { firstName: user.name.firstName },
    });

    // Sends an email to confirm the sign up
    await this.sendSignUpConfirmationEmail(user.email, emailConfirmationKey).catch((err: Error) => console.log(err));

    // Creates a test service
    Service.create({
        adminEmail: user.email,
        name: "Test Service",
        description: "En detaljeret beskrivelse",
        minutesTaken: 30,
        breakAfter: 0,
        cost: 500,
        onlineBooking: true,
        allCalendars: true,
    }).catch((err) => console.log(err));

    return user;
};

AdminClientSchema.statics.sendSignUpConfirmationEmail = async function (
    userEmail,
    emailConfirmationKey
) {
    return await sendSignUpConfirmation(userEmail, {
        confirmLink: `https://admin.booktid.net/bekraeft-email?key=${emailConfirmationKey}`,
        dateSent: dayjs().format("D. MMM YYYY"),
    })
};

export interface AdminClient extends Document {
    name: {
        firstName: string;
        lastName?: string;
    };
    email: string;
    emailConfirmed: boolean;
    changingEmail: boolean;
    changingEmailTo?: string;
    emailConfirmationKey: string;
    phoneNumber: string;
    password: string;
    pictureURLs: [string];
    businessInfo: {
        name: string;
        address: {
            city: string;
            postcode: string;
            street: string;
            number: string;
        };
    };
    bookingSettings: BookingSettings;
    subscriptionType: string;
    subscriptionStart: Date;
    maxNumberOfCalendars: number;
    stripeCustomerID: string;
    subscriptionID: string;
    subscriptionTypeName: string;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    lastMonthPaid: number;
    nextMonthPay: number;
    status: string;
    invoiceStatus: string;
    paymentMethodBrand: string;
    paymentMethodLast4: string;
    activatedApps: [string];
}

interface AdminClientModel extends Model<AdminClient> {
    // Static methods
    createDefault: (
        userInfo: {
            name: AdminClient["name"];
            email: AdminClient["email"];
            businessInfo: AdminClient["businessInfo"];
        },
        emailConfirmationKey: AdminClient["emailConfirmationKey"],
        stripeCustomer: { id: AdminClient["stripeCustomerID"] }
    ) => Promise<AdminClient>;

    sendSignUpConfirmationEmail: (
        userEmail: string,
        emailConfirmationKey: string
    ) => Promise<void>;
}

export const AdminClient: AdminClientModel = mongoose.model<
    AdminClient,
    AdminClientModel
>("AdminClient", AdminClientSchema);
