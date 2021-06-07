import ApplicationController from "../controllers/ApplicationController";
import { MyRequestHandler } from "../types";

// A decorator generator that runs a given middleware function before the action it decorates
export function beforeAction(middleware: MyRequestHandler) {
  return (target: ApplicationController, propertyKey: string) => {
    const action: MyRequestHandler = target[propertyKey];

    target[propertyKey] = [middleware, action];
  };
}
