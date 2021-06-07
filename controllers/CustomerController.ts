// Importing types & errors
import { MyRequestHandler, BadRequestError, UnauthorizedError } from "../types";

// Importing DB models
import { Customer } from "../db/models";

export default class CustomerController {
  static create: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    const customer = await Customer.create({
      ...req.body,
      adminEmail: req.user.email,
    });

    res.json(customer);
  };

  static readTotal: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    const count = await Customer.where("adminEmail", req.user.email)
      .countDocuments()
      .exec();

    res.json(count);
  };

  static read: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    if (!req.query.limit || !req.query.offset || !req.query.sortBy)
      throw new BadRequestError(
        "Limit, offset og sortBy er alle påkrævede felter"
      );

    const searchTerm = req.query.searchTerm?.toString();
    const limit = Number(req.query.limit);
    const offset = Number(req.query.offset);
    const sortBy = req.query.sortBy;

    let customers: Array<Customer>;

    if (searchTerm) {
      customers = await Customer.find({ adminEmail: req.user.email })
        .or([
          { email: new RegExp(searchTerm, "igs") },
          { name: new RegExp(searchTerm, "igs") },
          { phoneNumber: new RegExp(searchTerm, "igs") },
        ])
        .sort(sortBy)
        .skip(offset)
        .limit(limit)
        .exec();
    } else {
      customers = await Customer.find({ adminEmail: req.user.email })
        .sort(sortBy)
        .skip(offset)
        .limit(limit)
        .exec();
    }

    res.json(customers);
  };

  static update: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    const customer = await Customer.findByIdAndUpdate(
      req.body.customerID,
      req.body.new
    );

    res.json(customer);
  };

  static delete: MyRequestHandler = async (req, res) => {
    if (!req.user) throw new UnauthorizedError("Unauthorized");

    if (!req.body.customerID)
      throw new BadRequestError("Angiv venligst et kunde ID");

    const customer = await Customer.findByIdAndDelete(req.body.customerID);

    res.json(customer);
  };
}
