import express from "express";
import { body } from "express-validator";

import { handleError, verifyAdminKey } from "../../middleware";

import ServiceController from "../../controllers/ServiceController";

const serviceRouter = express.Router();

// Routes for categories
serviceRouter.post(
  "/create-category/:apiKey",
  verifyAdminKey,
  body("name")
    .exists()
    .isLength({ min: 1 })
    .withMessage("Giv venligst kategorien et navn"),
  handleError(ServiceController.createCategory)
);

serviceRouter.post(
  "/update-category/:apiKey",
  verifyAdminKey,
  body("name")
    .exists()
    .isLength({ min: 1 })
    .withMessage("Specificer venligst en opdatering"),
  body("id")
    .exists()
    .isLength({ min: 1 })
    .withMessage("Specificer venligst en kategori at opdaterer"),
  handleError(ServiceController.updateCategory)
);

serviceRouter.get(
  "/categories/:apiKey",
  verifyAdminKey,
  handleError(ServiceController.readCategories)
);

serviceRouter.delete(
  "/category/:apiKey",
  verifyAdminKey,
  body("id")
    .isLength({ min: 1 })
    .withMessage("Specificer venligst en kategori at slette"),
  handleError(ServiceController.deleteCategory)
);

// Routes for the actual services
serviceRouter.post(
  "/create-service/:apiKey",
  verifyAdminKey,
  body("name")
    .exists()
    .isLength({ min: 1 })
    .withMessage("Giv venligst servicen et navn"),
  body("minutesTaken")
    .exists()
    .isNumeric()
    .withMessage("Specificer venligst hvor langt tid servicen tager"),
  body("onlineBooking")
    .exists()
    .isBoolean()
    .withMessage("Specificer venligst om online booking bør være muligt"),
  handleError(ServiceController.create)
);

serviceRouter.post(
  "/update-service/:apiKey",
  verifyAdminKey,
  body("new.name")
    .exists()
    .isLength({ min: 1 })
    .withMessage("Giv venligst servicen et navn"),
  body("new.minutesTaken")
    .exists()
    .isNumeric()
    .withMessage("Specificer venligst hvor langt tid servicen tager"),
  body("new.onlineBooking")
    .exists()
    .isBoolean()
    .withMessage("Specificer venligst om online booking bør være muligt"),
  handleError(ServiceController.update)
);

serviceRouter.get(
  "/services/:apiKey",
  verifyAdminKey,
  handleError(ServiceController.read)
);

serviceRouter.delete(
  "/:apiKey",
  verifyAdminKey,
  handleError(ServiceController.delete)
);

export default serviceRouter;
