import { MyRequestHandler } from "../types";
import { Router } from "express";

export default class ApplicationController {
  // Middleware stack holding array of middleware to run before each request
  static beforeEach: MyRequestHandler[];

  static registerRouter(router: Router) {
    router.all("*", ...this.beforeEach);
  }
}
