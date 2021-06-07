import ApplicationController from "../controllers/ApplicationController";
import { handleError } from "../middleware";

export function handleErrors(
  target: ApplicationController,
  propertyKey: string
) {
  target[propertyKey] = handleError(target[propertyKey]);
}
