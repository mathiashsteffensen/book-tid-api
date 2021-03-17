import express from "express";

import { handleError, verifyAdminKey } from "../../middleware";

import AppStoreController from "../controllers/AppStoreController"

const appStoreRouter = express.Router();

appStoreRouter.post(
    "/activate-app/:apiKey",
    verifyAdminKey,
    handleError(AppStoreController.activateApp));

appStoreRouter.post(
    "/deactivate-app/:apiKey",
    verifyAdminKey,
    handleError(AppStoreController.deactivateApp));

appStoreRouter.get(
    "/app-settings/:apiKey/:appId",
    verifyAdminKey,
    handleError(AppStoreController.readSettings));

appStoreRouter.patch(
    "/app-settings/:apiKey/:appId",
    verifyAdminKey,
    handleError(AppStoreController.updateSettings));

appStoreRouter.patch(
    "/app-settings/client-ui-branding/logo/:apiKey",
    verifyAdminKey,
    handleError(AppStoreController.updateLogo));

export default appStoreRouter;