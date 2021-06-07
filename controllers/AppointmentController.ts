// Importing types & errors
import {
  MyRequestHandler,
  ServerError,
  BadRequestError,
  UnauthorizedError,
} from "../types";

// Importing DayJS for working with dates
import dayjs from "dayjs";

// Importing DB models
import { Appointment, Customer } from "../db/models";

// TODO: Move these function imports to methods on the DB model
import { validateNoAppointmentOverlap } from "../utils";

import {
  appointmentsByDay,
  appointmentsByWeek,
  appointmentsByMonth,
  appointmentsByYear,
  appointmentsByInterval,
} from "../db/queries";
import "dayjs/locale/da";
dayjs.locale("da");

export default class AppointmentController {
  static create: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    // eslint-disable-next-line github/no-then
    const customer = await Customer.findById(req.body.customerID).catch(
      (err) => {
        if (err.path === "_id") throw new BadRequestError("Ugyldigt kunde ID");
        else throw new ServerError(err);
      }
    );

    if (!customer) throw new BadRequestError("Ugyldigt kunde ID");

    const appointment = await Appointment.book(
      req.body,
      req.params.calendarID,
      req.user.email,
      customer,
      false,
      req.user.businessName,
      false,
      req.user.domainPrefix
    );

    res.json(appointment);
  };

  static readAll: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    let appointments;
    if (req.calendar) {
      appointments = await Appointment.find({
        adminEmail: req.user.email,
        calendarID: req.calendar.calendarID,
        cancelled: false,
      });
    } else {
      appointments = await Appointment.find({
        adminEmail: req.user.email,
        cancelled: false,
      });
    }

    res.json(appointments);
  };

  static readDaily: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    const appointments = await appointmentsByDay(
      req.user.email,
      req.params.dateInJSON,
      req.params.calendarID
    );

    res.json(appointments);
  };

  static readWeekly: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    const appointments = await appointmentsByWeek(
      req.user.email,
      req.params.dateInJSON,
      req.params.calendarID
    );

    res.json(appointments);
  };

  static readMonthly: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    const appointments = await appointmentsByMonth(
      req.user.email,
      req.params.dateInJSON,
      req.params.calendarID
    );

    res.json(appointments);
  };

  static readYearly: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    const appointments = await appointmentsByYear(
      req.user.email,
      req.params.dateInJSON,
      req.params.calendarID
    );

    res.json(appointments);
  };

  static readInterval: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    const appointments = await appointmentsByInterval(
      req.user.email,
      req.params.startDate,
      req.params.endDate,
      req.params.calendarID
    );

    res.json(appointments);
  };

  static update: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    const customer = await Customer.findById(req.body.customerID).exec();

    if (!customer) throw new BadRequestError("Ugyldigt kunde ID");

    const noOverlap = await validateNoAppointmentOverlap(
      req.user.email,
      req.params.calendarID,
      req.body.startTime,
      req.body.endTime
    );

    if (!noOverlap)
      throw new BadRequestError("Medarbejderen har en booking i perioden");

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.appointmentID,
      req.body
    );

    res.json(appointment);
  };

  static delete: MyRequestHandler = async (req, res) => {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.appointmentID,
      { cancelled: true }
    );

    res.json(appointment);
  };
}
