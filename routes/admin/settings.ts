import express from "express";

// Importing middleware
import { verifyAdminKey, handleError } from "../../middleware";

// Importing SettingsController for handling requests
import SettingsController from "../../controllers/SettingsController";

const settingsRouter = express.Router();

SettingsController.registerRouter(settingsRouter);

settingsRouter.get(
  "/booking/:apiKey?",
  handleError(SettingsController.getBooking)
);

settingsRouter.post(
  "/booking/:apiKey?",
  handleError(SettingsController.updateBooking)
);

settingsRouter.get(
  "/profile/:apiKey?",
  handleError(SettingsController.getProfile)
);

settingsRouter.post(
  "/profile/:apiKey?",
  handleError(SettingsController.updateProfile)
);

export default settingsRouter;
