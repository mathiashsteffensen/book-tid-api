// Importing mongoose for interfacing with MongoDB Shell
import mongoose, { Schema, Document, Model } from 'mongoose'

// Client UI Branding App Schema
const ClientUiBrandingAppSchema: Schema<ClientUiBrandingApp, ClientUiBrandingAppModel> = new Schema({
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

export interface ClientUiBrandingApp extends Document {
    adminEmail: string,
    activated: boolean,
    logo: string,
    primaryColor: string,
    secondaryColor: string,
    accentColor: string
}

export interface ClientUiBrandingAppModel extends Model<ClientUiBrandingApp> {}

// Configuring schemas to models and exporting them
export const ClientUiBrandingApp = mongoose.model<ClientUiBrandingApp, ClientUiBrandingAppModel>('ClientUiBrandingApp', ClientUiBrandingAppSchema)