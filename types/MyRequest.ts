import { Request as ExpressRequest } from "express"

import {
  AdminCalendar, AdminClient 
} from "db/models"

export default interface MyRequest extends ExpressRequest {
  user?: AdminClient
  calendar?: AdminCalendar
  client?: AdminClient
}
