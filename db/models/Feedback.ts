import mongoose, {
  Schema, Model, Document 
} from "mongoose"

const FeedbackSchema: Schema<Feedback, FeedbackModel> = new Schema({
  name: String,
  email: String,
  text: String,
  createdAt: {
    type: Date,
    default: () => 
      Date.now() 
  }
})

export interface Feedback extends Document {
  name: string,
  email: string,
  text: string,
  createdAt: Date
}

export type FeedbackModel = Model<Feedback>

export const Feedback = mongoose.model("Feedback", FeedbackSchema)
