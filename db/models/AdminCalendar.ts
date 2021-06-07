import mongoose, { Schema, Document, Model } from "mongoose";

// Admin Calendar Schema - schema for registering user calendars
const DailyScheduleSchema = new Schema({
  break: {
    type: Boolean,
    default: false,
  },
  open: {
    type: Boolean,
    required: true,
  },
  startOfWork: {
    hour: {
      type: Number,
      default: 8,
    },
    minute: {
      type: Number,
      default: 0,
    },
  },
  endOfWork: {
    hour: {
      type: Number,
      default: 16,
    },
    minute: {
      type: Number,
      default: 0,
    },
  },
  startOfBreak: {
    hour: {
      type: Number,
      default: 12,
    },
    minute: {
      type: Number,
      default: 0,
    },
  },
  endOfBreak: {
    hour: {
      type: Number,
      default: 12,
    },
    minute: {
      type: Number,
      default: 30,
    },
  },
});

export interface DailyScheduleSchema extends Document {
  break: boolean;
  open: boolean;
  startOfWork: {
    hour: number;
    minute: number;
  };
  endOfWork: {
    hour: number;
    minute: number;
  };
  startOfBreak: {
    hour: number;
    minute: number;
  };
  endOfBreak: {
    hour: number;
    minute: number;
  };
}

const AdminCalendarSchema: Schema<AdminCalendar, AdminCalendarModel> =
  new Schema({
    adminEmail: {
      type: String,
      required: true,
    },
    calendarID: {
      type: String,
      unique: true,
    },
    email: {
      type: String,
    },
    name: {
      type: String,
      required: true,
    },
    schedule: {
      scheduleType: {
        type: String,
        required: true,
      },
      weeklySchedule: [
        {
          day: 0,
          schedule: DailyScheduleSchema,
        },
        {
          day: 1,
          schedule: DailyScheduleSchema,
        },
        {
          day: 2,
          schedule: DailyScheduleSchema,
        },
        {
          day: 3,
          schedule: DailyScheduleSchema,
        },
        {
          day: 4,
          schedule: DailyScheduleSchema,
        },
        {
          day: 5,
          schedule: DailyScheduleSchema,
        },
        {
          day: 6,
          schedule: DailyScheduleSchema,
        },
      ],
      biWeeklySchedule: {
        evenWeek: [
          {
            day: 0,
            schedule: DailyScheduleSchema,
          },
          {
            day: 1,
            schedule: DailyScheduleSchema,
          },
          {
            day: 2,
            schedule: DailyScheduleSchema,
          },
          {
            day: 3,
            schedule: DailyScheduleSchema,
          },
          {
            day: 4,
            schedule: DailyScheduleSchema,
          },
          {
            day: 5,
            schedule: DailyScheduleSchema,
          },
          {
            day: 6,
            schedule: DailyScheduleSchema,
          },
        ],
        unevenWeek: [
          {
            day: 0,
            schedule: DailyScheduleSchema,
          },
          {
            day: 1,
            schedule: DailyScheduleSchema,
          },
          {
            day: 2,
            schedule: DailyScheduleSchema,
          },
          {
            day: 3,
            schedule: DailyScheduleSchema,
          },
          {
            day: 4,
            schedule: DailyScheduleSchema,
          },
          {
            day: 5,
            schedule: DailyScheduleSchema,
          },
          {
            day: 6,
            schedule: DailyScheduleSchema,
          },
        ],
      },
      specialWeek: [
        {
          year: {
            type: Number,
          },
          week: {
            type: Number,
          },
          schedule: [
            {
              day: 0,
              schedule: DailyScheduleSchema,
            },
            {
              day: 1,
              schedule: DailyScheduleSchema,
            },
            {
              day: 2,
              schedule: DailyScheduleSchema,
            },
            {
              day: 3,
              schedule: DailyScheduleSchema,
            },
            {
              day: 4,
              schedule: DailyScheduleSchema,
            },
            {
              day: 5,
              schedule: DailyScheduleSchema,
            },
            {
              day: 6,
              schedule: DailyScheduleSchema,
            },
          ],
        },
      ],
      holidaysOff: {
        type: Boolean,
        default: false,
      },
    },
    pictureURL: {
      type: String,
      default:
        "https://booktiddb.ams3.digitaloceanspaces.com/default-profile.png",
    },
    services: [String],
    standardColor: {
      type: String,
      required: true,
    },
    onlineColor: {
      type: String,
      required: true,
    },
  });

export interface AdminCalendar extends Document {
  adminEmail: string;
  calendarID: string;
  email: string;
  name: string;
  schedule: {
    scheduleType: string;
    weeklySchedule: [
      {
        day: 0;
        schedule: DailyScheduleSchema;
      },
      {
        day: 1;
        schedule: DailyScheduleSchema;
      },
      {
        day: 2;
        schedule: DailyScheduleSchema;
      },
      {
        day: 3;
        schedule: DailyScheduleSchema;
      },
      {
        day: 4;
        schedule: DailyScheduleSchema;
      },
      {
        day: 5;
        schedule: DailyScheduleSchema;
      },
      {
        day: 6;
        schedule: DailyScheduleSchema;
      }
    ];
    biWeeklySchedule: {
      evenWeek: [
        {
          day: 0;
          schedule: DailyScheduleSchema;
        },
        {
          day: 1;
          schedule: DailyScheduleSchema;
        },
        {
          day: 2;
          schedule: DailyScheduleSchema;
        },
        {
          day: 3;
          schedule: DailyScheduleSchema;
        },
        {
          day: 4;
          schedule: DailyScheduleSchema;
        },
        {
          day: 5;
          schedule: DailyScheduleSchema;
        },
        {
          day: 6;
          schedule: DailyScheduleSchema;
        }
      ];
      unevenWeek: [
        {
          day: 0;
          schedule: DailyScheduleSchema;
        },
        {
          day: 1;
          schedule: DailyScheduleSchema;
        },
        {
          day: 2;
          schedule: DailyScheduleSchema;
        },
        {
          day: 3;
          schedule: DailyScheduleSchema;
        },
        {
          day: 4;
          schedule: DailyScheduleSchema;
        },
        {
          day: 5;
          schedule: DailyScheduleSchema;
        },
        {
          day: 6;
          schedule: DailyScheduleSchema;
        }
      ];
    };
    specialWeek: [
      {
        year: number;
        week: number;
        schedule: [
          {
            day: 0;
            schedule: DailyScheduleSchema;
          },
          {
            day: 1;
            schedule: DailyScheduleSchema;
          },
          {
            day: 2;
            schedule: DailyScheduleSchema;
          },
          {
            day: 3;
            schedule: DailyScheduleSchema;
          },
          {
            day: 4;
            schedule: DailyScheduleSchema;
          },
          {
            day: 5;
            schedule: DailyScheduleSchema;
          },
          {
            day: 6;
            schedule: DailyScheduleSchema;
          }
        ];
      }
    ];
    holidaysOff: boolean;
  };
  pictureURL: string;
  services: [string];
  standardColor: string;
  onlineColor: string;
}

export interface AdminCalendarModel extends Model<AdminCalendar> {}

export const AdminCalendar =
  (mongoose.models.AdminCalendar as AdminCalendarModel) ||
  mongoose.model<AdminCalendar, AdminCalendarModel>(
    "AdminCalendar",
    AdminCalendarSchema
  );
