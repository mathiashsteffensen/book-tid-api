import express from "express";
import multer from "multer";

import { handleError } from "../middleware";

import FeedbackController from "../controllers/FeedbackController";

const parseFormData = multer().none();

const feedbackRouter = express.Router();

feedbackRouter.post("/", parseFormData, handleError(FeedbackController.create));

export default feedbackRouter;
