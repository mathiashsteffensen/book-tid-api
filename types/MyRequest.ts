import { Request } from "express";

export default interface MyRequest extends Request {
  adminEmail?: string;
  user?: {
    [property: string]: any;
  };
  client?: {
    [property: string]: any;
  };
  calendar?: {
    [property: string]: any;
  };
  file: any;
}
