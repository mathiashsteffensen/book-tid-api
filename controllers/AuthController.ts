// Importing types & errors
import { MyRequestHandler, BadRequestError, UnauthorizedError } from "../types";

// Importing DayJS for working with dates
import dayjs from "dayjs";

// Importing uniqid to create unique signup confirmation keys
import uniqid from "uniqid";

//Importing encryption software
import { verifyPassword, createToken } from "../utils";

// Import stripe
import stripe from "../integrations/stripe";

// Importing DB models
import {
  Service,
  AdminCalendar,
  Appointment,
  Customer,
  TextReminderApp,
  ServiceCategory,
  ClientUiBrandingApp,
} from "../db/models";

// Importing services
import { UserReaderService, UserWriterService } from "../services";

import ApplicationController from "./ApplicationController";

import "dayjs/locale/da";
import { CryptographyService } from "../services/CryptographyService";
import { DB } from "../db/prisma";
import { handleErrors } from "../decorators/handleErrors";
dayjs.locale("da");

export default class AuthController extends ApplicationController {
  @handleErrors
  static signup: MyRequestHandler = async (req, res) => {
    // Creates a stripe customer account
    const customer = await stripe.customers.create({
      email: req.body.email,
    });

    const emailConfirmationKey = uniqid("BOOKTID-");

    // For compatibility with the old frontend
    req.body.businessInfo = { name: req.body.businessInfo.name };

    // Creates the user
    const user = await UserWriterService.createWithDefaults({
      ...req.body,
      emailConfirmationKey,
      stripeCustomerId: customer.id,
    });

    res.json({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
    });
  };

  @handleErrors
  static confirmSignup: MyRequestHandler = async (req, res) => {
    const { emailConfirmationKey } = req.params;

    res.send(await UserWriterService.confirmEmail(emailConfirmationKey));
  };

  @handleErrors
  static resendSignupConfirmation: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    const emailConfirmationKey = uniqid("BOOKTID-");

    const client = await DB.client.user.update({
      where: {
        email: req.user.email,
      },
      data: {
        emailConfirmationKey,
      },
    });

    if (!client) throw new UnauthorizedError("Unauthorized");

    // Sends an email to confirm the new email address TODO: Add email sending
    //AdminClient.sendSignUpConfirmationEmail(
    //  client.changingEmailTo,
    //  newEmailConfirmationKey
    //).catch((err) => {
    //  throw new ServerError(err);
    //});

    res.send();
  };

  @handleErrors
  static login: MyRequestHandler = async (req, res) => {
    const cryptographyService = new CryptographyService();
    const userReaderService = new UserReaderService({
      email: req.body.email,
    });

    if (!(await userReaderService.userExists()))
      throw new BadRequestError("Forkert E-Mail eller kodeord");

    const user = await userReaderService.user;

    const valid = await cryptographyService.verifyPassword(
      req.body.password,
      user.password
    );
    if (valid) {
      const token = createToken({
        email: user.email,
        name: user.name,
      });
      res.json({ apiKey: token });
    } else {
      throw new BadRequestError("Forkert E-Mail eller kodeord");
    }
  };

  @handleErrors
  static deleteAccount: MyRequestHandler = async (req, res) => {
    if (!req.body.password) throw new UnauthorizedError("Forkert kodeord");

    if (!req.user) throw new UnauthorizedError("Forkert kodeord");

    const user = await new UserReaderService({ userId: req.user.id }).user;

    if (!user) throw new UnauthorizedError("Forkert kodeord");

    const valid = await verifyPassword(req.body.password, user.password);

    if (!valid) throw new UnauthorizedError("Forkert kodeord");

    const services = await Service.find({ adminEmail: req.user.email }).exec();

    const categories = await ServiceCategory.find({
      adminEmail: req.user.email,
    }).exec();

    const calendars = await AdminCalendar.find({
      adminEmail: req.user.email,
    }).exec();

    const appointments = await Appointment.find({
      adminEmail: req.user.email,
    }).exec();

    const customers = await Customer.find({
      adminEmail: req.user.email,
    }).exec();

    const textReminderApps = await TextReminderApp.find({
      adminEmail: req.user.email,
    }).exec();

    const clientUiBrandingApps = await ClientUiBrandingApp.find({
      adminEmail: req.user.email,
    }).exec();

    console.log(`Deleting ${services.length} services`);
    console.log(`Deleting ${categories.length} categories`);
    console.log(`Deleting ${calendars.length} calendars`);
    console.log(`Deleting ${appointments.length} appointments`);
    console.log(`Deleting ${customers.length} customers`);
    console.log(`Deleting ${textReminderApps.length} text reminder apps`);

    const deletePromises = services
      .map(async (service) => {
        await Service.findByIdAndDelete(service._id);
      })
      .concat(
        categories.map(async (category) => {
          await ServiceCategory.findByIdAndDelete(category._id);
        })
      )
      .concat(
        calendars.map(async (calendar) => {
          await AdminCalendar.findByIdAndDelete(calendar._id);
        })
      )
      .concat(
        appointments.map(async (appointment) => {
          await Appointment.findByIdAndDelete(appointment._id);
        })
      )
      .concat(
        customers.map(async (customer) => {
          await Customer.findByIdAndDelete(customer._id);
        })
      )
      .concat(
        textReminderApps.map(async (textReminderApp) => {
          await TextReminderApp.findByIdAndDelete(textReminderApp._id);
        })
      )
      .concat(
        clientUiBrandingApps.map(async (clientUiBrandingApp) => {
          await ClientUiBrandingApp.findByIdAndDelete(clientUiBrandingApp._id);
        })
      );

    await Promise.all(deletePromises);

    await DB.client.user.delete({
      where: {
        id: user.id,
      },
    });

    res.send();
  };
}
