// @ts-nocheck

import { MyRequestHandler } from "../types";

import { AdminClient, AdminCalendar } from "../db/models";

// Verify calendar is specified
const verifyCalendarID: MyRequestHandler = async (req, res, next) => {
  const calendarID = req.params.calendarID;
  if (calendarID) {
    AdminCalendar.findOne(
      { adminEmail: req.user.email, calendarID },
      (err, calendar) => {
        if (err)
          res.status(500).json({ msg: "Der skete en fejl prøv venligst igen" });
        if (calendar) {
          req.calendar = calendar;
          next();
        } else {
          res.status(400).json({ msg: "Kalenderen kunne ikke findes" });
        }
      }
    );
  } else {
    res.status(400).json({ msg: "Specificer venligst et kalendar ID" });
  }
};

// If calendar is optional
const fetchCalendar: MyRequestHandler = async (req, res, next) => {
  const calendarID = req.params.calendarID;
  if (calendarID !== undefined) {
    await AdminCalendar.findOne(
      { adminEmail: req.user.email, calendarID },
      (err, calendar) => {
        if (err) res.status(500).send();
        if (calendar) {
          req.calendar = calendar;
        }
      }
    );
  }
  next();
};
// @ts-ignore
const errorHandler = async (err, req, res, next) => {
  process.env.NODE_ENV === "development"
    ? console.log(res.statusCode, err.msg)
    : null;
  if (res.statusCode === 404) {
    res.send({
      msg: "didnt find that page, sorry bud",
    });
  } else {
    const status = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(status).json({
      msg: err.msg ? err.msg : "Der skete en fejl, prøv venligst igen",
      stack: process.env.NODE_ENV === "development" ? err.stack : "pancake",
    });
  }
};

export { errorHandler, verifyCalendarID, fetchCalendar };
