// Importing mongoose for interfacing with MongoDB Shell
const mongoose = require('mongoose')

/*** Create Schemas ***/

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
    },
    primaryColor: {
        type: String,
        default: "#345218"
    },
    secondaryColor: {
        type: String,
        default: "#2958af"
    },
    accentColor: {
        type: String,
        default: "#282930"
    }
})

// Configuring schemas to models and exporting them
const AdminCalendar = mongoose.model('AdminCalendar', AdminCalendarSchema)
const Customer = mongoose.model('Customer', CustomerSchema)
const Appointment = mongoose.model('Appointment', AppointmentSchema)
const ServiceCategory = mongoose.model('ServiceCategory', ServiceCategorySchema)
const Service = mongoose.model('Service', ServiceSchema)

const TextReminderApp = mongoose.model('TextReminderApp', TextReminderAppSchema)
const ClientUiBrandingApp = mongoose.model('ClientUiBrandingApp', ClientUiBrandingAppSchema)

module.exports = {
    AdminCalendar,
    Customer,
    Appointment,
    Service,
    ServiceCategory,
    TextReminderApp,
    ClientUiBrandingApp,
}