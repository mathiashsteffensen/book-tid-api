// Importing mongoose for interfacing with MongoDB Shell
const mongoose = require('mongoose')

/*** Create Schemas ***/

// BookingSettingsSchema 
const BookingSettingsSchema = new mongoose.Schema({
    domainPrefix: {
        type: String,
        unique: true
    },
    latestBookingBefore: {
        type: Number,
        default: 60
    },
    latestCancelBefore: {
        type: Number,
        default: 720
    },
    maxDaysBookAhead: {
        type: Number,
        default: 1092
    },
    newBookingEmail: {
        type: Boolean,
        default: true
    },
    cancelBookingEmail: {
        type: Boolean,
        default: true
    },
    requireCustomerAddress: {
        type: Boolean,
        default: false
    },
    hideCustomerCommentSection: {
        type: Boolean,
        default: false
    },
    hideServiceDuration: {
        type: Boolean,
        default: false
    },
    hideServicePrice: {
        type: Boolean,
        default: false
    },
    hideContactInfo: {
        type: Boolean,
        default: false
    },
    hideGoogleMaps: {
        type: Boolean,
        default: true
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
            `
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
            `
        }
    }
})

// Admin Client Schema - schema for registered users of the admin client 
const AdminClientSchema = new mongoose.Schema({
    name: {
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String
        }
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    emailConfirmed: {
        type: Boolean,
        default: false
    },
    changingEmail: {
        type: Boolean,
        default: false
    },
    changingEmailTo: {
        type: String,
    },
    emailConfirmationKey: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    pictureURLs: [{
        type: String
    }],
    businessInfo: {
        name: {
            type: String,
            required: true
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
                type: Number,
            }
        }
    },
    bookingSettings: BookingSettingsSchema,
    subscriptionType: {
        type: String,
        required: true
    },
    subscriptionStart: {
        type: Date,
        required: true
    },
    maxNumberOfCalendars: {
        type: Number,
        default: 1
    },
    stripeCustomerID: String,
    subscriptionID: String,
    subscriptionTypeName: String,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: {
        type: Boolean,
        default: false
    },
    lastMonthPaid: Number,
    nextMonthPay: Number,
    status: {
        type: String,
        required: true
    },
    invoiceStatus: {
        type: String
    },
    paymentMethodBrand: String,
    paymentMethodLast4: String,
    activatedApps: {
        type: [String],
        default: []
    }
})

// Admin Calendar Schema - schema for registering user calendars
const DailyScheduleSchema = new mongoose.Schema({
    break: {
        type: Boolean,
        default: false
    },
    open: {
        type: Boolean,
        required: true,
    },
    startOfWork: {
        hour: {
            type: Number,
            default: 8
        },
        minute: {
            type: Number,
            default: 0
        }
    },
    endOfWork: {
        hour: {
            type: Number,
            default: 16
        },
        minute: {
            type: Number,
            default: 0
        }
    },
    startOfBreak: {
        hour: {
            type: Number,
            default: 12
        },
        minute: {
            type: Number,
            default: 0
        }
    },
    endOfBreak: {
        hour: {
            type: Number,
            default: 12
        },
        minute: {
            type: Number,
            default: 30
        }
    },
})

const AdminCalendarSchema = new mongoose.Schema({
    adminEmail: {
        type: String,
        required: true
    },
    calendarID: {
        type: String,
        unique: true
    },
    email: {
        type: String
    },
    name: {
        type: String,
        required: true
    },
    schedule: {
        scheduleType: {
            type: String,
            required: true
        },
        weeklySchedule: [{
            day: 0,
            schedule: DailyScheduleSchema
        },
        {
            day: 1,
            schedule: DailyScheduleSchema
        },
        {
            day: 2,
            schedule: DailyScheduleSchema
        },
        {
            day: 3,
            schedule: DailyScheduleSchema
        },
        {
            day: 4,
            schedule: DailyScheduleSchema
        },
        {
            day: 5,
            schedule: DailyScheduleSchema
        },
        {
            day: 6,
            schedule: DailyScheduleSchema
        }],
        biWeeklySchedule: {
            evenWeek: [{
                day: 0,
                schedule: DailyScheduleSchema
            },
            {
                day: 1,
                schedule: DailyScheduleSchema
            },
            {
                day: 2,
                schedule: DailyScheduleSchema
            },
            {
                day: 3,
                schedule: DailyScheduleSchema
            },
            {
                day: 4,
                schedule: DailyScheduleSchema
            },
            {
                day: 5,
                schedule: DailyScheduleSchema
            },
            {
                day: 6,
                schedule: DailyScheduleSchema
            }],
            unevenWeek: [{
                day: 0,
                schedule: DailyScheduleSchema
            },
            {
                day: 1,
                schedule: DailyScheduleSchema
            },
            {
                day: 2,
                schedule: DailyScheduleSchema
            },
            {
                day: 3,
                schedule: DailyScheduleSchema
            },
            {
                day: 4,
                schedule: DailyScheduleSchema
            },
            {
                day: 5,
                schedule: DailyScheduleSchema
            },
            {
                day: 6,
                schedule: DailyScheduleSchema
            }]
        },
        specialWeek: [{
            year: {
                type: Number,
            },
            week: {
                type: Number,
            },
            schedule: [{
                day: 0,
                schedule: DailyScheduleSchema
            },
            {
                day: 1,
                schedule: DailyScheduleSchema
            },
            {
                day: 2,
                schedule: DailyScheduleSchema
            },
            {
                day: 3,
                schedule: DailyScheduleSchema
            },
            {
                day: 4,
                schedule: DailyScheduleSchema
            },
            {
                day: 5,
                schedule: DailyScheduleSchema
            },
            {
                day: 6,
                schedule: DailyScheduleSchema
            }]
        }],
        holidaysOff: {
            type: Boolean,
            default: false
        }
    },
    pictureURL: {
        type: String,
        default: 'https://booktiddb.ams3.digitaloceanspaces.com/default-profile.png'
    },
    services: [String],
    standardColor: {
        type: String,
        required: true,
    },
    onlineColor: {
        type: String,
        required: true
    }
})

const CustomerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String
    },
    note: {
        type: String
    },
    adminEmail: {
        type: String,
        required: true
    }
})
CustomerSchema.index({'$**': 'text'}); 

const AppointmentSchema = new mongoose.Schema({
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

// Service Category Schema
const ServiceCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    adminEmail: {
        type: String,
        required: true
    }
})

// Service Schema
const ServiceSchema = new mongoose.Schema({
    adminEmail: {
        type: String,
        required: true
    },
    categoryName: {
        type: String
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    minutesTaken: {
        type: Number,
        required: true
    },
    breakAfter: {
        type: Number,
        required: true
    },
    elgibleCalendars: [{
        id: {
            type: mongoose.ObjectId
        },
        name: {
            type: String
        }
    }],
    allCalendars: {
        type: Boolean,
        required: true
    },
    cost: {
        type: Number,
        default: 0
    },
    onlineBooking: {
        type: Boolean,
        required: true
    }
})

/*** Models for Premium Apps ***/

// Text Reminder App Schema
const TextReminderAppSchema = new mongoose.Schema({
    adminEmail: {
        type: String,
        required: true,
        unique: true,
    },
    activated: {
        type: Boolean,
        default: true
    },
    sendAs: {
        type: String,
        maxLength: 11,
        required: true
    },
    sendReminders: {
        type: Boolean,
        default: true
    },
    remindAt: {
        type: String,
        default: '12:00',
        description: "The time of day, the day before the appointment,, that a text reminder should be sent, formatted as 'HH:mm', defaults to '12:00', so noon"
    }
})

// Client UI Branding App Schema
const ClientUiBrandingAppSchema = new mongoose.Schema({
    adminEmail: {
        type: String,
        required: true,
        unique: true,
    },
    activated: {
        type: Boolean,
        default: true
    },
    logo: {
        type: String,
        default: "https://booktiddb.ams3.digitaloceanspaces.com/calendar-flat.svg"
    }
})

// Configuring schemas to models and exporting them
const AdminClient = mongoose.model('AdminClient', AdminClientSchema)
const AdminCalendar = mongoose.model('AdminCalendar', AdminCalendarSchema)
const Customer = mongoose.model('Customer', CustomerSchema)
const Appointment = mongoose.model('Appointment', AppointmentSchema)
const ServiceCategory = mongoose.model('ServiceCategory', ServiceCategorySchema)
const Service = mongoose.model('Service', ServiceSchema)

const TextReminderApp = mongoose.model('TextReminderApp', TextReminderAppSchema)
const ClientUiBrandingApp = mongoose.model('ClientUiBrandingApp', ClientUiBrandingAppSchema)

module.exports = {
    AdminClient,
    AdminCalendar,
    Customer,
    Appointment,
    Service,
    ServiceCategory,
    TextReminderApp,
    ClientUiBrandingApp,
    // Schema exports
    AdminCalendarSchema,
    AdminClientSchema,
    CustomerSchema,
    AppointmentSchema,
    ServiceCategorySchema,
    ServiceSchema,
    TextReminderAppSchema,
    ClientUiBrandingAppSchema
}