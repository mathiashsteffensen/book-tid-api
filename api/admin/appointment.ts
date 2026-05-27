import express from "express"
import { body } from "express-validator"

import {
  verifyAdminKey,
  verifyCalendarID,
  fetchCalendar,
  handleError
} from "middleware"

import {
  validateStartBeforeEnd,
  validateInsideOpeningHours
} from "utils"

import AppointmentController from "../controllers/AppointmentController"

const appointmentRouter = express.Router()

appointmentRouter.post("/create/:apiKey/:calendarID", verifyAdminKey, verifyCalendarID,
  body("service").exists().withMessage("Specificer venligst en service"),
  body("customerID").exists().withMessage("Specificer venligst en kunde"),
  body("startTime").exists().withMessage("Specificer venligst en start tid").custom((startTime, { req }) => {
    return validateStartBeforeEnd(startTime, req.body.endTime)
  }).withMessage("Start tiden skal være før slut tiden"),
  body("endTime").exists().withMessage("Specificer venligst en slut tid").custom((endTime, { req }) => {
    return validateInsideOpeningHours(req.body.startTime, endTime, req.calendar.schedule)
  }).withMessage("Tiden skal være inden for åbningstiden"), 
  handleError(AppointmentController.create))

appointmentRouter.post("/update/:apiKey/:calendarID/:appointmentID", verifyAdminKey, verifyCalendarID,
  body("startTime").custom((startTime, { req }) => {
    return validateStartBeforeEnd(startTime, req.body.endTime)
  }).withMessage("Start tiden skal være før slut tiden"),
  body("endTime").custom((endTime, { req }) => {
    return validateInsideOpeningHours(req.body.startTime, endTime, req.calendar.schedule)
  }).withMessage("Tiden skal være inden for åbningstiden"), 
  handleError(AppointmentController.update))

appointmentRouter.get("/all/:apiKey", verifyAdminKey, fetchCalendar, handleError(AppointmentController.readAll))

appointmentRouter.get("/on-day/:apiKey/:dateInJSON", verifyAdminKey, fetchCalendar, handleError(AppointmentController.readDaily))

appointmentRouter.get("/in-week/:apiKey/:dateInJSON", verifyAdminKey, fetchCalendar, handleError(AppointmentController.readWeekly))

appointmentRouter.get("/in-month/:apiKey/:dateInJSON", verifyAdminKey, fetchCalendar, handleError(AppointmentController.readMonthly))

appointmentRouter.get("/in-year/:apiKey/:dateInJSON", verifyAdminKey, fetchCalendar, handleError(AppointmentController.readYearly))

appointmentRouter.get("/in-interval/:apiKey/:startDate/:endDate", verifyAdminKey, fetchCalendar, handleError(AppointmentController.readInterval))

appointmentRouter.delete("/:apiKey/:appointmentID", verifyAdminKey, handleError(AppointmentController.delete))

export default appointmentRouter
