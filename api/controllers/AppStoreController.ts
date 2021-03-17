// Importing types & errors for the almighty TypeScript
import {
    MyRequestHandler,
    BadRequestError,
    UnauthorizedError,
    ServerError,
} from "../../types";

import {
    AdminClient,
    TextReminderApp,
    ClientUiBrandingApp,
} from "../../db/models";

import { upload, remove } from "../../integrations/aws";

export default class AppStoreController {
    static activateApp: MyRequestHandler = async (req, res) => {
        if (!req.user) throw new UnauthorizedError("Unauthorized");

        // Check if its a premium user, if not reject the request
        if (req.user.subscriptionTypeName !== "Premium")
            throw new UnauthorizedError(
                "Opgrader til premium for at gøre brug af BOOKTID.NETs Apps"
            );

        // Check if an app to activate is provided
        if (!req.body.app || !req.body.app.id)
            throw new BadRequestError("Specificer venligst en app at aktivere");

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
                const previousTextReminderApp = await TextReminderApp.findOne({
                    adminEmail: req.user.email,
                }).exec();

                if (previousTextReminderApp) {
                    previousTextReminderApp.activated = true;
                    previousTextReminderApp.save();
                    res.json(previousTextReminderApp);
                } else {
                    const textReminderApp = await TextReminderApp.create({
                        adminEmail: req.user.email,
                        sendAs: req.user.businessName.slice(0, 11),
                    });

                    res.json(textReminderApp);
                }
                break;
            case "clientUiBranding":
                const previousClientUiApp = await ClientUiBrandingApp.findOne({
                    adminEmail: req.user.email,
                }).exec();

                if (previousClientUiApp) {
                    previousClientUiApp.activated = true;
                    previousClientUiApp.save();
                    res.json(previousClientUiApp);
                } else {
                    const clientUiApp = await ClientUiBrandingApp.create({
                        adminEmail: req.user.email,
                        sendAs: req.user.businessName.slice(0, 11),
                    });

                    res.json(clientUiApp);
                }
                break;
            default:
                console.log("running default")
                throw new BadRequestError("unknown app");
        }
    };

    static deactivateApp: MyRequestHandler = async (req, res) => {
        if (!req.user) throw new UnauthorizedError("Unauthorized");

        // Check if its a premium user, if not reject the request
        if (req.user.subscriptionTypeName !== "Premium")
            throw new UnauthorizedError(
                "Opgrader til premium for at gøre brug af BOOKTID.NETs Apps"
            );

        // Check if an app to deactivate is provided
        if (!req.body.app || !req.body.app.id)
            throw new BadRequestError(
                "Specificer venligst en app at deaktivere"
            );

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

                res.json(textReminderApp);
                break;
            case "clientUiBranding":
                const clientUiApp = await ClientUiBrandingApp.findOneAndUpdate(
                    { adminEmail: req.user.email },
                    { activated: false }
                ).exec();

                res.json(clientUiApp);
                break;
            default:
                throw new BadRequestError("unknown app");
        }
    };

    static readSettings: MyRequestHandler = async (req, res) => {
        if (!req.user) throw new UnauthorizedError("Unauthorized");

        // Check if its a premium user, if not reject the request
        if (req.user.subscriptionTypeName !== "Premium")
            throw new UnauthorizedError(
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

                if (!textReminderApp)
                    throw new BadRequestError(
                        "App indstillinger kunne ikke findes"
                    );

                res.json(textReminderApp);
                break;
            case "clientUiBranding":
                const clientUiApp = await ClientUiBrandingApp.findOne({
                    adminEmail: req.user.email,
                    activated: true,
                })
                    .select("-activated -adminEmail -_id -__v")
                    .exec();

                if (!clientUiApp)
                    throw new BadRequestError(
                        "App indstillinger kunne ikke findes"
                    );

                res.json(clientUiApp);
                break;
            default:
                throw new BadRequestError("unknown app");
        }
    };

    static updateSettings: MyRequestHandler = async (req, res) => {
        if (!req.user) throw new UnauthorizedError("Unauthorized");

        // Check if its a premium user, if not reject the request
        if (req.user.subscriptionTypeName !== "Premium")
            throw new UnauthorizedError(
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

                if (!textReminderApp)
                    throw new BadRequestError(
                        "App indstillinger kunne ikke findes"
                    );

                res.json(textReminderApp);
                break;
            case "clientUiBranding":
                const clientUiBrandingApp = await ClientUiBrandingApp.findOneAndUpdate(
                    { adminEmail: req.user.email, activated: true },
                    {
                        primaryColor: req.body.primaryColor,
                        secondaryColor: req.body.secondaryColor,
                        accentColor: req.body.accentColor,
                    }
                ).exec();

                if (!clientUiBrandingApp)
                    throw new BadRequestError(
                        "App indstillinger kunne ikke findes"
                    );

                res.json(clientUiBrandingApp);
                break;
            default:
                throw new BadRequestError("unknown app");
        }
    };

    static updateLogo: MyRequestHandler = async (req, res) => {
        if (!req.user) throw new UnauthorizedError("Unauthorized");

        req.params.calendarID = Date.now().toString();

        // Check if its a premium user, if not reject the request
        if (req.user.subscriptionTypeName !== "Premium")
            throw new UnauthorizedError("Opgrader til premium for at gøre brug af BOOKTID.NETs Apps");

        // Checks if the app is activated
        const app = await ClientUiBrandingApp.findOne({
            adminEmail: req.user.email,
            activated: true,
        });

        if (!app) throw new BadRequestError("Appen er ikke aktiveret");

            upload.single("logo")(req, res, async (err: any) => {
                try {
                    if (err) throw new BadRequestError(err)
                    if (!req.file)
                        throw new BadRequestError(
                            "Vælg venligst et billede at uploade"
                        );
                    if (
                        app.logo !==
                        "https://booktiddb.ams3.digitaloceanspaces.com/calendar-flat.svg"
                    ) {
                        await remove(app.logo);
                    }

                    app.logo = req.file.location;
                    await app.save();

                    res.json(app);
                } catch (err) {
                    res.status(err.status)
                    res.json({msg: err.messsage})
                }
            });
        
        
    };
}
