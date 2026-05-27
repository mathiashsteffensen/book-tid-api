import { SortOrder } from "mongoose"
import {
  MyRequestHandler,
  BadRequestError,
  UnauthorizedError,
} from "types"
import { Customer } from "db/models"

export default class CustomerController {
  static create: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized")

    const customer = await Customer.create({
      ...req.body,
      adminEmail: req.user.email,
    })

    res.json(customer)
  }

  static readTotal: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized")

    const count = await Customer.where("adminEmail", req.user.email)
      .countDocuments()
      .exec()

    res.json(count)
  }

  static read: MyRequestHandler = async (req, res) => {
    const searchTerm = req.query.searchTerm?.toString()
    const limit = req.query.limit ? Number(req.query.limit) : undefined
    const offset = req.query.offset ? Number(req.query.offset) : undefined
    const sortBy = req.query.sortBy?.toString() || "name"

    let customersScope = Customer
      .find({ adminEmail: req.user.email })
      .sort(sortBy)

    if (searchTerm) {
      customersScope = customersScope.and([
        { email: new RegExp(searchTerm, "igs") },
        { name: new RegExp(searchTerm, "igs") },
        { phoneNumber: new RegExp(searchTerm, "igs") },
      ])
    }

    if (offset) {
      customersScope = customersScope.skip(offset)
    }

    if (limit) {
      customersScope = customersScope.limit(limit)
    }

    res.json(await customersScope.exec())
  }

  static update: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized")

    const customer = await Customer.findByIdAndUpdate(
      req.body.customerID,
      req.body.new
    )

    res.json(customer)
  }

  static delete: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized")

    if (!req.body.customerID)
      throw new BadRequestError("Angiv venligst et kunde ID")

    const customer = await Customer.findByIdAndDelete(req.body.customerID)

    res.json(customer)
  }
}
