import express from "express"
import multer from "multer"

import {
    handleError
} from "../middleware"

const parseFormData = multer().none()

import FeedbackController from "./controllers/FeedbackController"

let feedbackRouter = express.Router()

feedbackRouter.post("/", parseFormData, handleError(FeedbackController.create))

export default feedbackRouter