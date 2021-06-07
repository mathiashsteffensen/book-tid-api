import mongoose, { Schema, Model, Document, mongo } from "mongoose";

const FeedbackSchema: Schema<Feedback, FeedbackModel> = new Schema({
    name: String,
    email: String,
    text: String,
    createdAt: {
        type: Date,
        default: () => Date.now()
    }
})

export interface Feedback extends Document {
    name: string,
    email: string,
    text: string,
    createdAt: Date
}

export interface FeedbackModel extends Model<Feedback> {}

export const Feedback = mongoose.models.Feedback as FeedbackModel || mongoose.model("Feedback", FeedbackSchema)
