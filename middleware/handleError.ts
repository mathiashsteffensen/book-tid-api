import { Request, Response, NextFunction, RequestHandler } from "express";

import { MyRequest, MyRequestHandler, BadRequestError } from "../types";

import { __DEV__ } from "../constants";

import { validationResult } from "express-validator";

export function respondToError(res: Response, err: any) {
  if (!err.redirect) {
    res.status(err.status || 500);
    res.json({ msg: err.message });
  } else {
    res.redirect(`${err.redirectTo}?error=${err.message}`);
  }

  __DEV__ && console.log(err.message);
  __DEV__ && console.log(err.stack);
}

export function handleError(
  callback: RequestHandler | MyRequestHandler
): MyRequestHandler {
  return async (
    req: Request | MyRequest,
    res: Response,
    next: NextFunction
  ) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return respondToError(res, new BadRequestError(errors.array()[0].msg));
    }

    try {
      await callback(req, res, next);
    } catch (err) {
      respondToError(res, err);
    }
  };
}
