import { Request, Response, NextFunction, RequestHandler } from "express"

import {
    MyRequest,
    MyRequestHandler,
    BadRequestError
} from "../types"

import { __DEV__ } from "../constants"

import { validationResult } from 'express-validator';

export default function handleError(callback: RequestHandler | MyRequestHandler): MyRequestHandler {
    return async (req: Request | MyRequest, res: Response, next: NextFunction) => {
        try {
            // Finds the validation errors in this request and wraps them in an object with handy functions
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new BadRequestError(errors.array()[0].msg);
            }
            await callback(req, res, next)
        } catch (err) {
            res.status(err.status || 500)
            res.json({msg: err.message})

            __DEV__ && console.log(err.stack)
        }
    }
    
}