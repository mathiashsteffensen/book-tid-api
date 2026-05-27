import {
  DateHelper, Date 
} from "helpers/DateHelper"
import { FilterQuery } from "mongoose"

import {
  AdminCalendar,
  AdminClient,
  Appointment,
} from "./models"

const defaultSchedule = {
  scheduleType: "weekly",
  weeklySchedule: [
    {
      day: 0,
      schedule: { open: false, }, 
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
      schedule: { open: false, }, 
    },
  ],
  biWeeklySchedule: {
    evenWeek: [
      {
        day: 0,
        schedule: { open: false, }, 
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
        schedule: { open: false, }, 
      },
    ],
    unevenWeek: [
      {
        day: 0,
        schedule: { open: false, }, 
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
        schedule: { open: false, }, 
      },
    ], 
  },
}

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
]

const createDefaultCalendar = async (adminEmail, adminInfo) => {
  try {
    const currentAmount = await AdminCalendar.find({ adminEmail: adminEmail })
      .countDocuments()
      .exec()

    const maxAmount = await AdminClient.findOne({ email: adminEmail })
      .select("maxNumberOfCalendars")
      .exec()

    if (currentAmount === maxAmount.maxNumberOfCalendars) {
      throw new Error("Opgrader for at lave flere medarbejderkalendre")
    }

    let colorPalette

    if (colorList.length > currentAmount) {
      colorPalette = colorList[currentAmount]
    } else {
      colorPalette =
        colorList[
          currentAmount -
            Math.floor(currentAmount / colorList.length) * colorList.length
        ]
    }
    const calendar = await AdminCalendar.create(
      {
        adminEmail: adminEmail,
        name: adminInfo.name.firstName,
        email: adminEmail,
        schedule: defaultSchedule,
        services: ["Test Service"],
        holidaysOff: false,
        standardColor: colorPalette.onlineColor,
        onlineColor: colorPalette.standardColor,
      }
    )

    return { calendarID: calendar._id }
  } catch (err) {
    throw new Error(err.message)
  }
}

const appointmentsByDay = async (adminEmail: string, date: string, calendarID?: string) => {
  return appointmentsByInterval(
    adminEmail,
    DateHelper.utc(date).startOf("day"),
    DateHelper.utc(date).endOf("day"),
    calendarID
  )
}

const appointmentsByWeek = async (adminEmail: string, date: string, calendarID?: string) => {
  return appointmentsByInterval(
    adminEmail,
    DateHelper.utc(date).day(0).startOf("day"),
    DateHelper.utc(date).day(6).endOf("day"),
    calendarID
  )
}

const appointmentsByMonth = async (adminEmail: string, date: string, calendarID?: string) => {
  return appointmentsByInterval(
    adminEmail,
    DateHelper.utc(date).startOf("month").startOf("day"),
    DateHelper.utc(date).endOf("month").endOf("day"),
    calendarID
  )
}

const appointmentsByYear = async (adminEmail: string, date: string, calendarID?: string) => {
  return appointmentsByInterval(
    adminEmail,
    DateHelper.utc(date).startOf("year").startOf("day"),
    DateHelper.utc(date).endOf("year").endOf("day"),
    calendarID
  )
}

const appointmentsByInterval = async (adminEmail: string, startDate: Date, endDate: Date, calendarID?: string) => {
  const filters: FilterQuery<Appointment> = {
    adminEmail,
    date: {
      $gte: startDate.toDate(),
      $lte: endDate.toDate(), 
    },
    cancelled: false,
  }

  if (calendarID) {
    filters.calendarID = calendarID
  }

  return Appointment.find(filters).exec()
}

const obeysBookingRestrictions = async (user, date) => {
  let maxBookingsPerMonth
  switch (user.subscriptionTypeName) {
    case "Premium":
      return true
    case "Basic":
      maxBookingsPerMonth = 150
      break
    default:
      maxBookingsPerMonth = 50
  }

  const appointmentsInMonth = (await appointmentsByMonth(user.email, date))
    .length

  return appointmentsInMonth < maxBookingsPerMonth
}

module.exports = {
  createDefaultCalendar,
  appointmentsByDay,
  appointmentsByWeek,
  appointmentsByMonth,
  appointmentsByYear,
  appointmentsByInterval,
  obeysBookingRestrictions,
}

export {
  createDefaultCalendar,
  appointmentsByDay,
  appointmentsByWeek,
  appointmentsByMonth,
  appointmentsByYear,
  appointmentsByInterval,
  obeysBookingRestrictions,
}
