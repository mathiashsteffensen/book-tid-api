// Importing uniqid to create unique signup confirmation keys + SendGrid integration functions for sending confirmation emails
import uniqid from "uniqid";
import { sendNewEmailConfirmation } from "../integrations/sendgrid";

// Importing Dayjs for working with dates
import dayjs from "dayjs";

// Importing types
import { MyRequestHandler, UnauthorizedError, BadRequestError } from "../types";

// Importing DB models
import { AdminClient } from "../db/models";
import ApplicationController from "./ApplicationController";
import { verifyAdminKey } from "../middleware";
import { UserReaderService, UserWriterService } from "../services";
import { DB } from "../db/prisma";

export default class SettingsController extends ApplicationController {
  static beforeEach = [verifyAdminKey];

  static getBooking: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    const { bookingSettings } = await new UserReaderService({
      userId: req.user.id,
    }).user;

    res.send(bookingSettings);
  };

  static updateBooking: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    let client: DB.User & { bookingSettings?: DB.BookingSettings };

    if (req.body.domainPrefix)
      client = await UserReaderService.userByDomainPrefix(
        req.body.domainPrefix
      );

    if (client && client.email !== req.user.email)
      throw new BadRequestError("Domæne navn er allerede i brug");

    const userWriterService = new UserWriterService({ userId: req.user.id });

    client = await userWriterService.updateBookingSettings(req.body);

    res.json(client.bookingSettings);
  };

  // TODO: Migrate routes to new User database
  static getProfile: MyRequestHandler = async (req, res) => {
    console.log(req.user);
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    let client = await new UserReaderService({
      userId: req.user.id,
    }).withSubscription();

    client = {
      ...client,
      ...client.subscription,
    };

    res.json(client);
  };

  static updateProfile: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    const { name, email, phoneNumber, businessInfo } = req.body;

    if (email.toLowerCase() !== req.user.email) {
      const userWithNewEmail = await AdminClient.findOne({ email }).exec();

      if (userWithNewEmail) throw new BadRequestError("E-Mail allerede i brug");

      const emailConfirmationKey = uniqid("BOOKTID-");

      await AdminClient.findOneAndUpdate(
        { email: req.user.email },
        {
          changingEmail: true,
          changingEmailTo: email,
          emailConfirmationKey,
        }
      ).exec();

      await sendNewEmailConfirmation(req.user.email, {
        confirmLink: `https://admin.booktid.net/bekraeft-email?key=${emailConfirmationKey}`,
        dateSent: dayjs().format("D. MMM YYYY"),
        newEmail: email,
      });
    }

    await AdminClient.findOneAndUpdate(
      { email: req.user.email },
      {
        name,
        phoneNumber,
        businessInfo,
      }
    ).exec();

    res.send();
  };
}
