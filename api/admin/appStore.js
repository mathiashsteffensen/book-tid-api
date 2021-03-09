const express = require("express");

const { verifyAdminKey } = require("../../middleware");

const {
    AdminClient,
    TextReminderApp,
    ClientUiBrandingApp,
} = require("../../db/models");

const {
    upload,
    remove
} = require("../../integrations/aws")

const appStoreRouter = express.Router();

appStoreRouter.post(
    "/activate-app/:apiKey",
    verifyAdminKey,
    async (req, res, next) => {
        try {
            // Check if its a premium user, if not reject the request
            if (req.user.subscriptionTypeName !== "Premium")
                throw new Error(
                    "Opgrader til premium for at gøre brug af BOOKTID.NETs Apps"
                );

            // Check if an app to activate is provided
            if (!req.body.app || !req.body.app.id)
                throw new Error("Specificer venligst en app at aktivere");

            // Save the app as activated on the user
            await AdminClient.findOneAndUpdate(
                { email: req.user.email },
                {
                    $push: {
                        activatedApps: req.body.app.id,
                    },
                }
            );

            // Check if the app has been previously used, if so reactivate old DB instance, otherwise create a DB Instance for the App data to use
            switch (req.body.app.id) {
                case "textReminder":
                    const previousTextReminderApp = await TextReminderApp.findOne(
                        {
                            adminEmail: req.user.email,
                        }
                    ).exec();

                    if (previousTextReminderApp) {
                        previousTextReminderApp.activated = true;
                        previousTextReminderApp.save();
                        return res.json(previousTextReminderApp);
                    }

                    const textReminderApp = await TextReminderApp.create({
                        adminEmail: req.user.email,
                        sendAs: req.user.businessName.slice(0, 11),
                    });

                    return res.json(textReminderApp);
                case "clientUiBranding":
                    const previousClientUiApp = await ClientUiBrandingApp.findOne(
                        {
                            adminEmail: req.user.email,
                        }
                    ).exec();

                    if (previousClientUiApp) {
                        previousClientUiApp.activated = true;
                        previousClientUiApp.save();
                        return res.json(previousClientUiApp);
                    }

                    const clientUiApp = await ClientUiBrandingApp.create({
                        adminEmail: req.user.email,
                        sendAs: req.user.businessName.slice(0, 11),
                    });

                    return res.json(clientUiApp);

                default:
                    throw new Error("unknown app");
            }
        } catch (err) {
            next({ msg: err.message, stack: err.stack });
        }
    }
);

appStoreRouter.post(
    "/deactivate-app/:apiKey",
    verifyAdminKey,
    async (req, res, next) => {
        try {
            // Check if its a premium user, if not reject the request
            if (req.user.subscriptionTypeName !== "Premium")
                throw new Error(
                    "Opgrader til premium for at gøre brug af BOOKTID.NETs Apps"
                );

            // Check if an app to deactivate is provided
            if (!req.body.app || !req.body.app.id)
                throw new Error("Specificer venligst en app at deaktivere");

            // Remove the app from the list of activated apps on the user
            await AdminClient.findOneAndUpdate(
                { email: req.user.email },
                {
                    $pull: {
                        activatedApps: req.body.app.id,
                    },
                }
            );

            // Deactivate the Apps DB instance for later use
            switch (req.body.app.id) {
                case "textReminder":
                    const textReminderApp = await TextReminderApp.findOneAndUpdate(
                        { adminEmail: req.user.email },
                        { activated: false }
                    ).exec();

                    return res.json(textReminderApp);

                case "clientUiBranding":
                    const clientUiApp = await ClientUiBrandingApp.findOneAndUpdate(
                        { adminEmail: req.user.email },
                        { activated: false }
                    ).exec();

                    return res.json(clientUiApp);
                default:
                    throw new Error("unknown app");
            }
        } catch (err) {
            next({ msg: err.message, stack: err.stack });
        }
    }
);

appStoreRouter.get(
    "/app-settings/:apiKey/:appId",
    verifyAdminKey,
    async (req, res, next) => {
        try {
            // Check if its a premium user, if not reject the request
            if (req.user.subscriptionTypeName !== "Premium")
                throw new Error(
                    "Opgrader til premium for at gøre brug af BOOKTID.NETs Apps"
                );

            // Get the settings from the DB
            switch (req.params.appId) {
                case "textReminder":
                    const textReminderApp = await TextReminderApp.findOne({
                        adminEmail: req.user.email,
                        activated: true,
                    })
                        .select("-activated -adminEmail -_id -__v")
                        .exec();

                    if (!textReminderApp) {
                        res.status(400);
                        throw new Error("App indstillinger kunne ikke findes");
                    }

                    return res.json(textReminderApp);

                case "clientUiBranding":
                    const clientUiApp = await ClientUiBrandingApp.findOne({
                        adminEmail: req.user.email,
                        activated: true,
                    })
                        .select("-activated -adminEmail -_id -__v")
                        .exec();

                    if (!clientUiApp) {
                        res.status(400);
                        throw new Error("App indstillinger kunne ikke findes");
                    }

                    return res.json(clientUiApp);

                default:
                    throw new Error("unknown app");
            }
        } catch (err) {
            next({ msg: err.message, stack: err.stack });
        }
    }
);

appStoreRouter.patch(
    "/app-settings/:apiKey/:appId",
    verifyAdminKey,
    async (req, res, next) => {
        try {
            // Check if its a premium user, if not reject the request
            if (req.user.subscriptionTypeName !== "Premium")
                throw new Error(
                    "Opgrader til premium for at gøre brug af BOOKTID.NETs Apps"
                );

            // Get the settings from the DB
            switch (req.params.appId) {
                case "textReminder":
                    const textReminderApp = await TextReminderApp.findOneAndUpdate(
                        { adminEmail: req.user.email, activated: true },
                        {
                            remindAt: req.body.remindAt,
                            sendReminders: req.body.sendReminders,
                            sendAs: req.body.sendAs,
                        }
                    ).exec();

                    if (!textReminderApp) {
                        res.status(400);
                        throw new Error("App indstillinger kunne ikke findes");
                    }

                    return res.json(textReminderApp);
                case "clientUiBranding":
                    const clientUiBrandingApp = await ClientUiBrandingApp.findOneAndUpdate(
                        { adminEmail: req.user.email, activated: true },
                        {
                            primaryColor: req.body.primaryColor,
                            secondaryColor: req.body.secondaryColor,
                            accentColor: req.body.accentColor
                        }
                    ).exec();

                    if (!clientUiBrandingApp) {
                        res.status(400);
                        throw new Error("App indstillinger kunne ikke findes");
                    }

                    return res.json(clientUiBrandingApp)     
                default:
                    throw new Error("unknown app");
            }
        } catch (err) {
            next({ msg: err.message, stack: err.stack });
        }
    }
);

appStoreRouter.patch(
    "/app-settings/client-ui-branding/logo/:apiKey",
    verifyAdminKey,
    async (req, res, next) => {
        req.params.calendarID = Date.now().toString()

        // Check if its a premium user, if not reject the request
        if (req.user.subscriptionTypeName !== "Premium") return next({msg: "Opgrader til premium for at gøre brug af BOOKTID.NETs Apps"})

        // Checks if the app is activated
        const app = await ClientUiBrandingApp.findOne({ adminEmail: req.user.email, activated: true })

        if (!app) return next({msg: "Appen er ikke aktiveret"})

        try {
            upload.single("logo")(req, res, async (err) => {
                if (err) {
                    res.status(400);
                    next({ msg: err.message });
                } else {
                    if (req.file) {
                        try {
                            console.log(req.file.location)
                            if (app.logo !== "https://booktiddb.ams3.digitaloceanspaces.com/calendar-flat.svg") {
                                await remove(app.logo)
                            }
                            
                            app.logo = req.file.location
                            await app.save()

                            res.json(app)
                        } catch (error) {
                            next({ msg: error.message, stack: error.stack });
                        }
                    } else {
                        res.status(400);
                        next({ msg: "Vælg venligst et billede at uploade" });
                    }
                }
            });
        } catch (uploadError) {
            console.log(uploadError)
            next({msg: "Der skete en uventet fejl"})
        }
        
    }
);

module.exports = appStoreRouter;
