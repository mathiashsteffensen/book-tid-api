export interface BadRequestError extends Error {
  redirect: boolean;
  redirectTo: string;
}

export class BadRequestError extends Error {
  constructor(
    message: string,
    stack?: string,
    redirect: boolean = false,
    redirectTo: string = "/"
  ) {
    super(message);

    this.stack = stack;
    this.redirect = redirect;
    this.redirectTo = redirectTo;
  }

  status = 400;
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
  }

  status = 401;
}

export class ServerError extends Error {
  constructor(err: Error) {
    super(
      "Der skete en fejl med vores servere, prøv venligst igen senere eller kontakt vores support"
    );

    this.stack = err.stack;
  }

  status = 500;
}
