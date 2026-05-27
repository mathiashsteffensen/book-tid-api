import {
  MyRequestHandler,
  ServerError,
  BadRequestError,
  UnauthorizedError,
} from "types"
import { createDefaultCalendar } from "db/queries"
import {
  AdminCalendar, AdminClient 
} from "db/models"
import { remove } from "integrations/aws"

export default class CalendarController {
  static create: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized")

    const calendarID = await createDefaultCalendar(req.user.email, { name: { firstName: req.user.name.firstName }, })
    res.json(calendarID)
  }

  static readMaxAllowed: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized")

    const max = await AdminClient.findOne({ email: req.user.email })
      .select("maxNumberOfCalendars")
      .catch((err) => {
        throw new ServerError(err)
      })

    if (!max) throw new UnauthorizedError("Unauthorized")

    res.json(max.maxNumberOfCalendars)
  }

  static read: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized")

    let calendars: Array<AdminCalendar> | AdminCalendar | null

    if (!req.params.calendarID)
      calendars = await AdminCalendar.find({ adminEmail: req.user.email, }).exec().catch((err) => {
        throw new ServerError(err)
      })
    else
      calendars = await AdminCalendar.findOne({
        adminEmail: req.user.email,
        calendarID: req.params.calendarID 
      }).exec().catch((err) => {
        throw new ServerError(err)
      })

    if (!calendars) throw new BadRequestError("")

    res.json(calendars)
  }

  static update: MyRequestHandler = async (req, res) => {
    const calendar = await AdminCalendar.findOneAndUpdate(
      {
        _id: req.params.id,
        adminEmail: req.user.email,
      },
      req.body.new
    )

    res.json(calendar)
  }

  static delete: MyRequestHandler = async (req, res) => {
    const calendar = await AdminCalendar.findOneAndDelete({
      adminEmail: req.user.email,
      calendarID: req.params.id,
    })

    res.json(calendar)
  }

  static createAvatar: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized")

    if (!req.file)
      throw new BadRequestError("Vælg venligst et billede at uploade")

    const file = req.file as Express.MulterS3.File

    const calendar = await AdminCalendar.findOneAndUpdate(
      {
        adminEmail: req.user.email,
        calendarID: req.params.calendarID, 
      },
      { pictureURL: file.location }
    )

    const client = await AdminClient.findOne({ email: req.user.email })

    if (!client) throw new UnauthorizedError("Unauthorized")

    const pictureURLs = [...client.pictureURLs, ...[file.location]]

    await client.updateOne({ pictureURLs: pictureURLs })

    res.json({
      ...calendar,
      pictureURL: file.location,
    })
  }

  static readAvatars: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized")

    const client = await AdminClient.findOne({ email: req.user.email })
      .select("pictureURLs")
      .exec()

    if (!client) throw new UnauthorizedError("Unauthorized")

    res.json(client.pictureURLs)
  }

  static deleteAvatar: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized")

    await remove(req.body.pictureURL)

    const client = await AdminClient.findOne({ email: req.user.email, }).exec()

    if (!client) throw new UnauthorizedError("Unauthorized")

    const pictureURLs = client.pictureURLs.filter((url) => 
      url !== req.body.pictureURL)

    const calendars = await AdminCalendar.find({
      adminEmail: req.user.email,
      pictureURL: req.body.pictureURL, 
    }).exec()

    await Promise.all(calendars.map(async(calendar) => {
      await calendar
        .updateOne({ pictureURL:
                        "https://booktiddb.ams3.digitaloceanspaces.com/default-profile.png", })
        .exec()
    }))

    await client.updateOne({ pictureURLs: pictureURLs })

    res.json()
  }
}
