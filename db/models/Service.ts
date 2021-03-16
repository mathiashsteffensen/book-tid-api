import mongoose, { Schema, Document, Model } from "mongoose"

// Service Category Schema
const ServiceCategorySchema: Schema<ServiceCategory, ServiceCategoryModel> = new Schema({
    name: {
        type: String,
        required: true
    },
    adminEmail: {
        type: String,
        required: true
    }
})

export interface ServiceCategory extends Document {
    name: string,
    adminEmail: string
}

export interface ServiceCategoryModel extends Model<ServiceCategory> {}

// Service Schema
const ServiceSchema: Schema<Service, ServiceModel> = new Schema({
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
            type: Schema.Types.ObjectId
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

export interface Service extends Document {
    adminEmail: string,
    categoryName?: string,
    name: string,
    description?: string,
    minutesTaken: number,
    breakAfter: number,
    elgibleCalendars: Array<{
        id: Schema.Types.ObjectId,
        name: string
    }>,
    allCalendars: boolean,
    cost: number,
    onlineBooking: boolean
}

export interface ServiceModel extends Model<Service> {}

export const ServiceCategory = mongoose.model<ServiceCategory, ServiceCategoryModel>("ServiceCategory", ServiceCategorySchema);
export const Service = mongoose.model<Service, ServiceModel>("Service", ServiceSchema);