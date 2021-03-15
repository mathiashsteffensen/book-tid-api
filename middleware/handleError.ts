import { Request, Response, NextFunction, RequestHandler } from "express"

import {
    MyRequest,
    MyRequestHandler
} from "../types"

import { __DEV__ } from "../constants"

export default function handleError(callback: RequestHandler | MyRequestHandler): MyRequestHandler {
    return async (req: Request | MyRequest, res: Response, next: NextFunction) => {
        try {
            await callback(req, res, next)
        } catch (err) {
            res.status(err.status || 500)
            res.json({msg: err.message})

            __DEV__ && console.log(err.stack)
        }
    }
    
}