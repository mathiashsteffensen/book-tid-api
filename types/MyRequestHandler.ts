import { Response, NextFunction } from "express"
import MyRequest from "./MyRequest"

type MyRequestHandler = (req: MyRequest, res: Response, next: NextFunction) => Promise<void>

export default MyRequestHandler