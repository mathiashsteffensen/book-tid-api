import express from "express"

// Importing middleware
import { verifyAdminKey, handleError } from '../../middleware'

// Importing SettingsController for handling requests
import SetttingsController from "../controllers/SettingsController"

const settingsRouter = express.Router()

settingsRouter.get('/booking/:apiKey', verifyAdminKey, handleError(SetttingsController.getBooking))

settingsRouter.post('/booking/:apiKey', verifyAdminKey, handleError(SetttingsController.updateBooking))

settingsRouter.get('/profile/:apiKey', verifyAdminKey, handleError(SetttingsController.getProfile))

settingsRouter.post('/profile/:apiKey', verifyAdminKey, handleError(SetttingsController.updateProfile))

export default settingsRouter