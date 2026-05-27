import {
  BadRequestError,
  MyRequestHandler,
  ServerError,
  UnauthorizedError,
} from "types"
import {
  Service, ServiceCategory 
} from "db/models"

export class ServiceController {
  static createCategory: MyRequestHandler = async (req, res) => {
    const category = await ServiceCategory.findOne({
      name: req.body.name,
      adminEmail: req.user.email, 
    }).catch((err) => {
      throw new ServerError(err)
    })

    if (category) 
      throw new BadRequestError(
        "Der eksisterer allerede en kategori med navnet"
      )

    const newCategory = await ServiceCategory.create({
      name: req.body.name,
      adminEmail: req.user.email, 
    }).catch((err) => {
      throw new ServerError(err)
    })

    res.json(newCategory)
  }

  static readCategories: MyRequestHandler = async (req, res) => {
    const categories = await ServiceCategory.find({ adminEmail: req.user.email, }).catch((err) => {
      throw new ServerError(err)
    })

    res.json(categories)
  }

  static updateCategory: MyRequestHandler = async (req, res) => {
    const preExistingCategory = await ServiceCategory.findOne({
      name: req.body.name,
      adminEmail: req.user.email,
    }).exec().catch((err) => {
      throw new ServerError(err)
    })

    if (preExistingCategory)
      throw new BadRequestError(
        "Der eksisterer allerede en kategori med navnet"
      )

    const category = await ServiceCategory.findById(req.params.id).exec().catch(
      (err) => {
        throw new ServerError(err)
      }
    )

    if (!category) throw new BadRequestError("Kunne ikke finde kategori")

    const servicesToUpdate = await Service.find({ categoryName: category.name, }).exec()

    await Promise.all(servicesToUpdate.map(async (serviceToUpdate) => {
      return await serviceToUpdate.updateOne({ categoryName: req.body.name }).exec()
    }))

    category.name = req.body.name

    await category.save()

    res.json(category)
  }

  static deleteCategory: MyRequestHandler = async (req, res) => {
    const category = await ServiceCategory.findByIdAndDelete(
      req.params.id
    ).catch((err) => {
      throw new ServerError(err)
    })

    res.json(category)
  }

  static create: MyRequestHandler = async (req, res) => {
    const service = await Service.create({
      ...req.body,
      ...{ adminEmail: req.user.email }, 
    }).catch((err) => {
      throw new ServerError(err)
    })

    res.json(service)
  }

  static index: MyRequestHandler = async (req, res) => {
    const services = await Service.find({ adminEmail: req.user.email, }).catch((err) => {
      throw new ServerError(err)
    })

    res.json(services)
  }

  static update: MyRequestHandler = async (req, res) => {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body
    )

    res.json(service)
  }

  static delete: MyRequestHandler = async (req, res) => {
    const service = await Service.findByIdAndDelete(req.params.id)

    res.json(service)
  }
}
