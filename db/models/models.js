// Importing mongoose for interfacing with MongoDB Shell
const mongoose = require('mongoose')

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

const TextReminderApp = mongoose.model('TextReminderApp', TextReminderAppSchema)
const ClientUiBrandingApp = mongoose.model('ClientUiBrandingApp', ClientUiBrandingAppSchema)

module.exports = {
    TextReminderApp,
    ClientUiBrandingApp,
}