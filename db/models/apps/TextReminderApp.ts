import mongoose, {Schema, Document, Model, mongo} from "mongoose"

// Text Reminder App Schema
const TextReminderAppSchema: Schema<TextReminderApp, TextReminderAppModel> = new Schema({
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

export interface TextReminderApp extends Document {
    adminEmail: string,
    activated: boolean,
    sendAs: string,
    sendReminders: boolean,
    remindAt: string
}

export interface TextReminderAppModel extends Model<TextReminderApp> {}

export const TextReminderApp = mongoose.models.TextReminderApp as TextReminderAppModel || mongoose.model<TextReminderApp, TextReminderAppModel>('TextReminderApp', TextReminderAppSchema)
