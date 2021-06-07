import { createDefaultCalendar } from "../db/queries";

import { AdminCalendar } from "../db/models";

import { remove } from "../integrations/aws";

import { MyRequestHandler, BadRequestError, UnauthorizedError } from "../types";
import { UserReaderService, UserWriterService } from "../services";
import { beforeAction, handleErrors } from "../decorators";
import { verifyAdminKey } from "../middleware";

export default class CalendarController {
  static create: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    const calendarID = await createDefaultCalendar(req.user.email, {
      name: { firstName: req.user.name },
    });
    res.json(calendarID);
  };

  @beforeAction(verifyAdminKey)
  @handleErrors
  static readMaxAllowed: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    const max = { maxNumberOfCalendars: 1 };

    if (!max) throw new UnauthorizedError("Unauthorized");

    res.json(max.maxNumberOfCalendars);
  };

  @beforeAction(verifyAdminKey)
  @handleErrors
  static read: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    let calendars: Array<AdminCalendar> | AdminCalendar | null;

    if (!req.params.calendarID)
      calendars = await AdminCalendar.find({
        adminEmail: req.user.email,
      }).exec();
    else
      calendars = await AdminCalendar.findOne({
        adminEmail: req.user.email,
        calendarID: req.params.calendarID,
      }).exec();

    if (!calendars) throw new BadRequestError("");

    res.json(calendars);
  };

  static update: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    if (!req.body.calendarID) throw new BadRequestError("Ugyldigt kalender id");

    const calendar = await AdminCalendar.findOneAndUpdate(
      { adminEmail: req.user.email, calendarID: req.body.calendarID },
      req.body.new
    );

    res.json(calendar);
  };

  static delete: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    if (!req.body.calendarID) throw new BadRequestError("Ugyldigt kalender id");

    const calendar = await AdminCalendar.findOneAndDelete({
      adminEmail: req.user.email,
      calendarID: req.body.calendarID,
    });

    res.json(calendar);
  };

  static createAvatar: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    if (!req.file)
      throw new BadRequestError("Vælg venligst et billede at uploade");

    const calendar = await AdminCalendar.findOneAndUpdate(
      {
        adminEmail: req.user.email,
        calendarID: req.params.calendarID,
      },
      { pictureURL: req.file.location }
    );

    const userWriterService = new UserWriterService({ userId: req.user.id });

    if (!(await userWriterService.userExists()))
      throw new UnauthorizedError("Unauthorized");

    await userWriterService.addPictureURL(req.file.location);

    res.json({
      ...calendar,
      ...{
        pictureURL: req.file.location,
      },
    });
  };

  static readAvatars: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    const userReaderService = new UserReaderService({ userId: req.user.id });

    const pictureURLs = await userReaderService.getPictureURLs();

    res.json(pictureURLs);
  };

  static deleteAvatar: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    // Remove the picture from S3 storage
    await remove(req.body.pictureURL);

    // Remove the picture URL from the database
    const userWriterService = new UserWriterService({ userId: req.user.id });

    await userWriterService.removePictureURL(req.body.pictureURL);

    // Resetting all calendars using this picture
    const calendars = await AdminCalendar.find({
      adminEmail: req.user.email,
      pictureURL: req.body.pictureURL,
    }).exec();
    await Promise.all(
      calendars.map(async (calendar) => {
        await calendar
          .updateOne({
            pictureURL:
              "https://booktiddb.ams3.digitaloceanspaces.com/default-profile.png",
          })
          .exec();
      })
    );

    res.json();
  };
}
