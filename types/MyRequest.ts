import { Request } from "express"

import { AdminClient } from "../db/models"

export default interface MyRequest extends Request {
    user?: {
        [property: string]: any
    }
    calendar?: {
        [property: string]: any
    }
}