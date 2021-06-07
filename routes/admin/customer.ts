import express from 'express';
import { body } from 'express-validator';

import { Customer } from '../../db/models';
import { verifyAdminKey, handleError } from '../../middleware';

import CustomerController from "../../controllers/CustomerController"

const customerRouter = express.Router()

customerRouter.delete('/:apiKey', verifyAdminKey, handleError(CustomerController.delete))

customerRouter.post('/create/:apiKey', verifyAdminKey, [
    body('name').isLength({min: 1}).withMessage('Indtast venligst et navn'),
    body('email').isEmail().withMessage('Indtast venligst en gyldig E-Mail')
], handleError(CustomerController.create))

customerRouter.post('/update/:apiKey', verifyAdminKey,  [
    body('new.name').isLength({min: 1}).withMessage('Indtast venligst et navn'),
    body('new.email').isEmail().withMessage('Indtast venligst en gyldig E-Mail')
], handleError(CustomerController.update))

customerRouter.get('/total/:apiKey', verifyAdminKey, handleError(CustomerController.readTotal))

customerRouter.get('/list/search/:apiKey', verifyAdminKey, handleError(CustomerController.read))

export default customerRouter
