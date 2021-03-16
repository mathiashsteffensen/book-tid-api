const db = require("../db/db");
import {
  AdminCalendar,
  Service,
  AdminClient,
  Appointment,
} from "./models"

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
require("dayjs/locale/da");
dayjs.extend(utc);
dayjs.locale("da");

let defaultSchedule = {
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

let colorList = [
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

let createDefaultCalendar = async (adminEmail, adminInfo) => {
  let calendarID;
  try {
    calendarID = `${Date.now()}`;

    let currentAmount = await AdminCalendar.find({ adminEmail: adminEmail })
      .countDocuments()
      .exec();

    let maxAmount = await AdminClient.findOne({ email: adminEmail })
      .select("maxNumberOfCalendars")
      .exec();

    if (currentAmount === maxAmount.maxNumberOfCalendars) {
      throw new Error("Opgrader for at lave flere medarbejderkalendre");
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
    AdminCalendar.create(
      {
        adminEmail: adminEmail,
        calendarID: calendarID,
        name: adminInfo.name.firstName,
        email: adminEmail,
        schedule: defaultSchedule,
        services: ["Test Service"],
        holidaysOff: false,
        standardColor: colorPalette.onlineColor,
        onlineColor: colorPalette.standardColor,
      },
      function (err) {
        if (err) throw new Error(err);
      }
    );
  } catch (err) {
    throw new Error(err.message);
  }
  return { calendarID };
};

let createTestCustomer = async (adminEmail) => {};

let createTestService = async (admineEmail) => {
  Service.create({
    name: "Test service",
    description: "En detaljeret beskrivelse.",
    minutesTaken: 30,
  });
};

let createDefaultInstance = async (adminEmail) => {};

let appointmentsByDay = async (adminEmail, date, calendarID) => {
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

let appointmentsByWeek = async (adminEmail, date, calendarID) => {
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

let appointmentsByMonth = async (adminEmail, date, calendarID) => {
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

let appointmentsByYear = async (adminEmail, date, calendarID) => {
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

let appointmentsByInterval = async (adminEmail, startDate, endDate, calendarID) => {
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
}

let obeysBookingRestrictions = async (user, date) => {
  let maxBookingsPerMonth;
  switch (user.subscriptionTypeName) {
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
}