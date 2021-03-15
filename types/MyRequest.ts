import { Request } from "express"

export default interface MyRequest extends Request {
    user?: {
        [property: string]: any
    }
}