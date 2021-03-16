import {
    BadRequestError,
    MyRequestHandler,
    ServerError,
    UnauthorizedError,
} from "../../types";

import { Service, ServiceCategory } from "../../db/models";

export default class ServiceController {
    static createCategory: MyRequestHandler = async (req, res) => {
        if (!req.user) throw new UnauthorizedError("Unauthorized");

        const category = await ServiceCategory.findOne({
            name: req.body.name,
            adminEmail: req.user.email,
        }).catch((err) => {
            throw new ServerError(err);
        });

        if (category) 
            throw new BadRequestError(
                "Der eksisterer allerede en kategori med navnet"
            );

        const newCategory = await ServiceCategory.create({
            name: req.body.name,
            adminEmail: req.user.email,
        }).catch((err) => {
            throw new ServerError(err);
        });

        res.json(newCategory);
    };

    static readCategories: MyRequestHandler = async (req, res) => {
        if (!req.user) throw new UnauthorizedError("Unauthorized");

        const categories = await ServiceCategory.find({
            adminEmail: req.user.email,
        }).catch((err) => {
            throw new ServerError(err);
        });

        res.json(categories);
    };

    static updateCategory: MyRequestHandler = async (req, res) => {
        if (!req.user) throw new UnauthorizedError("Unauthorized");

        const preExistingCategory = await ServiceCategory.findOne({
            name: req.body.name,
            adminEmail: req.user.email,
        }).exec().catch((err) => {
            throw new ServerError(err);
        });

        if (preExistingCategory)
            throw new BadRequestError(
                "Der eksisterer allerede en kategori med navnet"
            );

        const category = await ServiceCategory.findById(req.body.id).exec().catch(
            (err) => {
                throw new ServerError(err);
            }
        );

        if (!category) throw new BadRequestError("Kunne ikke finde kategori");

        let servicesToUpdate = await Service.find({
            categoryName: category.name,
        }).exec();

        await Promise.all(servicesToUpdate.map(async (serviceToUpdate) => {
            return await serviceToUpdate.updateOne({ categoryName: req.body.name }).exec();
        }));

        category.name = req.body.name;

        await category.save();

        res.json(category);
    };

    static deleteCategory: MyRequestHandler = async (req, res) => {
        if (!req.user) throw new UnauthorizedError("Unauthorized");

        // Deletes category
        const category = await ServiceCategory.findByIdAndDelete(
            req.body.id
        ).catch((err) => {
            throw new ServerError(err);
        });

        res.json(category);
    };

    static create: MyRequestHandler = async (req, res) => {
        if (!req.user) throw new UnauthorizedError("Unauthorized");

        // Creates the service
        const service = await Service.create({
            ...req.body,
            ...{ adminEmail: req.user.email },
        }).catch((err) => {
            throw new ServerError(err);
        });

        res.json(service);
    };

    static read: MyRequestHandler = async (req, res) => {
        if (!req.user) throw new UnauthorizedError("Unauthorized");

        const services = await Service.find({
            adminEmail: req.user.email,
        }).catch((err) => {
            throw new ServerError(err);
        });

        res.json(services);
    };

    static update: MyRequestHandler = async (req, res) => {
        if (!req.user) throw new UnauthorizedError("Unauthorized");

        const service = await Service.findByIdAndUpdate(
            req.body.serviceID,
            req.body.new
        ).catch((err) => {
            throw new ServerError(err);
        });

        res.json(service);
    };

    static delete: MyRequestHandler = async (req, res) => {
        if (!req.user) throw new UnauthorizedError("Unauthorized");

        if (!req.body.serviceID)
            throw new BadRequestError("Specificer venligst et service ID");

        const service = await Service.findByIdAndDelete(req.body.serviceID).catch(
            (err) => {
                throw new ServerError(err);
            }
        );

        if (!service) throw new BadRequestError("Ugenkendeligt service ID");

        res.json(service);
    };
}
