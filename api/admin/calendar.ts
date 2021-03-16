import express from 'express'

import { createDefaultCalendar } from '../../db/queries'

import { AdminCalendar, AdminClient } from '../../db/models'

import { verifyAdminKey, handleError } from '../../middleware'

import { upload, remove } from '../../integrations/aws'

import CalendarController from "../controllers/CalendarController"

const calendarRouter = express.Router()

calendarRouter.get('/max-allowed/:apiKey', verifyAdminKey, handleError(CalendarController.readMaxAllowed))

calendarRouter.get('/all/:apiKey', verifyAdminKey, handleError(CalendarController.read))

calendarRouter.get('/by-id/:apiKey/:calendarID', verifyAdminKey, handleError(CalendarController.read))

calendarRouter.post('/create/:apiKey', verifyAdminKey, handleError(CalendarController.create))

calendarRouter.post('/update/:apiKey', verifyAdminKey, handleError(CalendarController.update))

calendarRouter.delete('/:apiKey', verifyAdminKey, handleError(CalendarController.delete))


// Add options for seeing all uploaded pictures + deletion options to not overflow db - also add filesize validation for this purpose
// Read up on the Amazon S3 SDK ...
calendarRouter.post('/upload-avatar/:apiKey/:calendarID', verifyAdminKey, upload.single("avatar"), handleError(CalendarController.createAvatar))

calendarRouter.get('/avatars/:apiKey', verifyAdminKey, handleError(CalendarController.readAvatars))

calendarRouter.delete('/avatar/:apiKey', verifyAdminKey, handleError(CalendarController.deleteAvatar))


module.exports = calendarRouter