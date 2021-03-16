// Importing express & express-validator
import express from 'express'
import { body } from 'express-validator';

// Importing types & errors
import {
    MyRequest,
} from "../../types"

// Importing AuthController for handling requests
import AuthController from "../controllers/AuthController"

import {
    verifyAdminKey,
    handleError
} from "../../middleware"

/*** Creating authorization router & routes ***/
const authRouter = express.Router()

authRouter.post('/signup/free', [
    body('businessInfo.name').exists().withMessage('Udfyld venligst din virksomheds navn - dette bruges til din personlige booking side f.eks. "frisørlacour.booktid.net"'),
    body('name.firstName').isAlpha('da-DK').isLength({min: 1}).withMessage('Udfyld venligst et gyldigt navn'),
    body('email').isEmail().withMessage('Udfyld venligst en gyldig email'),
    body('password').isLength({ min: 5 }).withMessage('Password should be at least 5 characters'),
    body('phoneNumber').isLength({min: 8, max: 12}).withMessage('Telefonnummeret skal være 8 eller 12 tal').isNumeric().withMessage('Telefonnummeret må kun bestå af tal')
  ], handleError(AuthController.signup))

authRouter.get('/confirm-signup/:emailConfirmationKey', handleError(AuthController.confirmSignup))

authRouter.get('/confirm-signup/resend/:apiKey', verifyAdminKey, handleError(AuthController.resendSignupConfirmation))

authRouter.post('/login', handleError(AuthController.login))

authRouter.get('/verify-key/:apiKey', verifyAdminKey, (req: MyRequest, res) =>
{
    res.send(req.user)
})

authRouter.delete('/my-account/:apiKey', verifyAdminKey, handleError(AuthController.deleteAccount))

module.exports = authRouter

export default authRouter