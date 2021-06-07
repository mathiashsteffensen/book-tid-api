import { AdminCalendar, Service, Appointment } from "./models";
import { BadRequestError } from "../types";
const db = require("../db/db");

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
require("dayjs/locale/da");
dayjs.extend(utc);
dayjs.locale("da");

const defaultSchedule = {
  scheduleType: "weekly",
  weeklySchedule: [
    {
      day: 0,
      schedule: {
        open: false,
      },
    },
    {
      day: 1,
      schedule: {
        open: true,
        startOfWork: {
          hour: 8,
          minute: 0,
        },
        endOfWork: {
          hour: 16,
          minute: 0,
        },
      },
    },
    {
      day: 2,
      schedule: {
        open: true,
        startOfWork: {
          hour: 8,
          minute: 0,
        },
        endOfWork: {
          hour: 16,
          minute: 0,
        },
      },
    },
    {
      day: 3,
      schedule: {
        open: true,
        startOfWork: {
          hour: 8,
          minute: 0,
        },
        endOfWork: {
          hour: 16,
          minute: 0,
        },
      },
    },
    {
      day: 4,
      schedule: {
        open: true,
        startOfWork: {
          hour: 8,
          minute: 0,
        },
        endOfWork: {
          hour: 16,
          minute: 0,
        },
      },
    },
    {
      day: 5,
      schedule: {
        open: true,
        startOfWork: {
          hour: 8,
          minute: 0,
        },
        endOfWork: {
          hour: 16,
          minute: 0,
        },
      },
    },
    {
      day: 6,
      schedule: {
        open: false,
      },
    },
  ],
  biWeeklySchedule: {
    evenWeek: [
      {
        day: 0,
        schedule: {
          open: false,
        },
      },
      {
        day: 1,
        schedule: {
          open: true,
          startOfWork: {
            hour: 8,
            minute: 0,
          },
          endOfWork: {
            hour: 16,
            minute: 0,
          },
        },
      },
      {
        day: 2,
        schedule: {
          open: true,
          startOfWork: {
            hour: 8,
            minute: 0,
          },
          endOfWork: {
            hour: 16,
            minute: 0,
          },
        },
      },
      {
        day: 3,
        schedule: {
          open: true,
          startOfWork: {
            hour: 8,
            minute: 0,
          },
          endOfWork: {
            hour: 16,
            minute: 0,
          },
        },
      },
      {
        day: 4,
        schedule: {
          open: true,
          startOfWork: {
            hour: 8,
            minute: 0,
          },
          endOfWork: {
            hour: 16,
            minute: 0,
          },
        },
      },
      {
        day: 5,
        schedule: {
          open: true,
          startOfWork: {
            hour: 8,
            minute: 0,
          },
          endOfWork: {
            hour: 16,
            minute: 0,
          },
        },
      },
      {
        day: 6,
        schedule: {
          open: false,
        },
      },
    ],
    unevenWeek: [
      {
        day: 0,
        schedule: {
          open: false,
        },
      },
      {
        day: 1,
        schedule: {
          open: true,
          startOfWork: {
            hour: 8,
            minute: 0,
          },
          endOfWork: {
            hour: 16,
            minute: 0,
          },
        },
      },
      {
        day: 2,
        schedule: {
          open: true,
          startOfWork: {
            hour: 8,
            minute: 0,
          },
          endOfWork: {
            hour: 16,
            minute: 0,
          },
        },
      },
      {
        day: 3,
        schedule: {
          open: true,
          startOfWork: {
            hour: 8,
            minute: 0,
          },
          endOfWork: {
            hour: 16,
            minute: 0,
          },
        },
      },
      {
        day: 4,
        schedule: {
          open: true,
          startOfWork: {
            hour: 8,
            minute: 0,
          },
          endOfWork: {
            hour: 16,
            minute: 0,
          },
        },
      },
      {
        day: 5,
        schedule: {
          open: true,
          startOfWork: {
            hour: 8,
            minute: 0,
          },
          endOfWork: {
            hour: 16,
            minute: 0,
          },
        },
      },
      {
        day: 6,
        schedule: {
          open: false,
        },
      },
    ],
  },
};

const colorList = [
  {
    standardColor: "#f0001f",
    onlineColor: "#49adcc",
  },
  {
    standardColor: "#CEE27D",
    onlineColor: "#E00543",
  },
  {
    standardColor: "#D58936",
    onlineColor: "#FFF94F",
  },
  {
    standardColor: "#F1AB86",
    onlineColor: "#7ED3B2",
  },
  {
    standardColor: "#004A2F",
    onlineColor: "#FF6337",
  },
];

const createDefaultCalendar = async (adminEmail, adminInfo) => {
  const calendarID = `${Date.now()}`;

  const currentAmount = await AdminCalendar.find({ adminEmail })
    .countDocuments()
    .exec();

  const maxAmount = { maxNumberOfCalendars: 1 };

  if (currentAmount === maxAmount.maxNumberOfCalendars) {
    throw new BadRequestError("Opgrader for at lave flere medarbejderkalendre");
  }

  let colorPalette;

  if (colorList.length > currentAmount) {
    colorPalette = colorList[currentAmount];
  } else {
    colorPalette =
      colorList[
        currentAmount -
          Math.floor(currentAmount / colorList.length) * colorList.length
      ];
  }
  await AdminCalendar.create({
    adminEmail,
    calendarID,
    name: adminInfo.name.firstName,
    email: adminEmail,
    schedule: defaultSchedule,
    services: ["Test Service"],
    holidaysOff: false,
    standardColor: colorPalette.onlineColor,
    onlineColor: colorPalette.standardColor,
  });

  return { calendarID };
};

const createTestCustomer = async (adminEmail) => {};

const createTestService = async (admineEmail) => {
  Service.create({
    name: "Test service",
    description: "En detaljeret beskrivelse.",
    minutesTaken: 30,
  });
};

const createDefaultInstance = async (adminEmail) => {};

const appointmentsByDay = async (adminEmail, date, calendarID) => {
  if (calendarID) {
    var appointments = (
      await Appointment.find({
        adminEmail,
        calendarID,
        date: dayjs.utc(date).toJSON().slice(0, 10),
        cancelled: false,
      })
        .exec()
        .catch(() => {
          throw new Error("Der skete en fejl, prøv venligst igen");
        })
    ).filter((appointment) => !appointment.cancelled);
  } else {
    var appointments = (
      await Appointment.find({
        adminEmail,
        date: dayjs.utc(date).toJSON().slice(0, 10),
        cancelled: false,
      })
        .exec()
        .catch(() => {
          throw new Error("Der skete en fejl, prøv venligst igen");
        })
    ).filter((appointment) => !appointment.cancelled);
  }
  return appointments;
};

const appointmentsByWeek = async (adminEmail, date, calendarID) => {
  if (calendarID) {
    var appointments = (
      await Appointment.find({
        adminEmail,
        calendarID,
        date: {
          $gte: dayjs.utc(date).day(0).startOf("day").toJSON(),
          $lte: dayjs.utc(date).day(0).add(1, "week").endOf("day").toJSON(),
        },
        cancelled: false,
      })
        .exec()
        .catch(() => {
          throw new Error("Der skete en fejl, prøv venligst igen");
        })
    ).filter((appointment) => !appointment.cancelled);
  } else {
    var appointments = (
      await Appointment.find({
        adminEmail,
        date: {
          $gte: dayjs.utc(date).day(0).startOf("day").toJSON(),
          $lte: dayjs.utc(date).day(0).add(1, "week").endOf("day").toJSON(),
        },
        cancelled: false,
      })
        .exec()
        .catch(() => {
          throw new Error("Der skete en fejl, prøv venligst igen");
        })
    ).filter((appointment) => !appointment.cancelled);
  }

  return appointments;
};

const appointmentsByMonth = async (adminEmail, date, calendarID) => {
  if (calendarID) {
    var appointments = (
      await Appointment.find({
        adminEmail,
        calendarID,
        date: {
          $gte: dayjs.utc(date).startOf("month").startOf("day").toJSON(),
          $lte: dayjs.utc(date).endOf("month").endOf("day").toJSON(),
        },
        cancelled: false,
      })
        .exec()
        .catch(() => {
          throw new Error("Der skete en fejl, prøv venligst igen");
        })
    ).filter((appointment) => !appointment.cancelled);
  } else {
    var appointments = (
      await Appointment.find({
        adminEmail,
        date: {
          $gte: dayjs.utc(date).startOf("month").startOf("day").toJSON(),
          $lte: dayjs.utc(date).endOf("month").endOf("day").toJSON(),
        },
        cancelled: false,
      })
        .exec()
        .catch(() => {
          throw new Error("Der skete en fejl, prøv venligst igen");
        })
    ).filter((appointment) => !appointment.cancelled);
  }

  return appointments;
};

const appointmentsByYear = async (adminEmail, date, calendarID) => {
  if (calendarID) {
    var appointments = await Appointment.find({
      adminEmail,
      calendarID,
      date: {
        $gte: dayjs.utc(date).startOf("year").startOf("day").toJSON(),
        $lte: dayjs.utc(date).endOf("year").endOf("day").toJSON(),
      },
      cancelled: false,
    })
      .exec()
      .catch(() => {
        throw new Error("Der skete en fejl, prøv venligst igen");
      });
  } else {
    var appointments = await Appointment.find({
      adminEmail,
      date: {
        $gte: dayjs.utc(date).startOf("year").startOf("day").toJSON(),
        $lte: dayjs.utc(date).endOf("year").endOf("day").toJSON(),
      },
      cancelled: false,
    })
      .exec()
      .catch(() => {
        throw new Error("Der skete en fejl, prøv venligst igen");
      });
  }

  return appointments;
};

const appointmentsByInterval = async (
  adminEmail,
  startDate,
  endDate,
  calendarID
) => {
  if (calendarID) {
    var appointments = await Appointment.find({
      adminEmail,
      calendarID,
      date: {
        $gte: dayjs.utc(startDate).toJSON(),
        $lte: dayjs.utc(endDate).toJSON(),
      },
      cancelled: false,
    })
      .exec()
      .catch(() => {
        throw new Error("Der skete en fejl, prøv venligst igen");
      });
  } else {
    var appointments = await Appointment.find({
      adminEmail,
      date: {
        $gte: dayjs.utc(startDate).toJSON(),
        $lte: dayjs.utc(endDate).toJSON(),
      },
      cancelled: false,
    })
      .exec()
      .catch(() => {
        throw new Error("Der skete en fejl, prøv venligst igen");
      });
  }

  return appointments;
};

const obeysBookingRestrictions = async (user, date) => {
  let maxBookingsPerMonth;
  switch (user.subscription.subscriptionTypeName) {
    case "Premium":
      return true;
    case "Basic":
      maxBookingsPerMonth = 150;
      break;
    default:
      maxBookingsPerMonth = 50;
  }

  const appointmentsInMonth = (await appointmentsByMonth(user.email, date))
    .length;

  return appointmentsInMonth < maxBookingsPerMonth;
};

module.exports = {
  createDefaultInstance,
  createDefaultCalendar,
  appointmentsByDay,
  appointmentsByWeek,
  appointmentsByMonth,
  appointmentsByYear,
  appointmentsByInterval,
  obeysBookingRestrictions,
};

export {
  createDefaultInstance,
  createDefaultCalendar,
  appointmentsByDay,
  appointmentsByWeek,
  appointmentsByMonth,
  appointmentsByYear,
  appointmentsByInterval,
  obeysBookingRestrictions,
};
