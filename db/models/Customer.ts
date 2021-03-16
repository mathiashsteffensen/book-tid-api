import mongoose, { Schema, Model, Document } from "mongoose"

const CustomerSchema: Schema<Customer, CustomerModel> = new Schema({
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

export interface Customer extends Document {
    name: string,
    email: string,
    phoneNumber: string,
    note?: string,
    adminEmail: string
}

export interface CustomerModel extends Model<Customer> {}

export const Customer = mongoose.model<Customer, CustomerModel>('Customer', CustomerSchema)