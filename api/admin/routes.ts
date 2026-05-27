import { ServiceController } from "api/admin/controllers/ServiceController"
import AppointmentController from "api/controllers/AppointmentController"
import AuthController from "api/controllers/AuthController"
import CalendarController from "api/controllers/CalendarController"
import CustomerController from "api/controllers/CustomerController"
import express from "express"
import cors, {
  CorsOptions, CorsOptionsDelegate
} from "cors"
import rateLimit from "express-rate-limit"
import { body } from "express-validator"

import { verifyAdminKey } from "middleware"
import { UserController } from "api/admin/controllers/UserController"

import authRouter from "./auth"
import calendarRouter from "./calendar"
import customerRouter from "./customer"
import appointmentRouter from "./appointment"
import settingsRouter from "./settings"
import appStoreRouter from "./appStore"
import payRouter from "api/admin/stripe/pay"
import productsRouter from "api/admin/stripe/products"

export const adminRouter = express.Router()

const whitelist = ["https://admin.booktid.net", "http://localhost:3000"]
const corsOptionsDelegate: CorsOptionsDelegate = function (req, callback) {
  const corsOptions: CorsOptions = {
    methods: [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD",
      "PATCH"
    ],
    allowedHeaders: ["content-type", "authorization"],
    credentials: true,
    // @ts-expect-error Typescript complains about the "header" method not existing, but it does
    origin: whitelist.indexOf(req.header("Origin") || "") !== -1,
  }

  callback(null, corsOptions)
}

adminRouter.use(cors(corsOptionsDelegate))

// Rate limiting the API to deter DDoS attacks
const adminAPILimiter = rateLimit({
  windowMs: 1000,
  max: 100
})

adminRouter.use(adminAPILimiter)

adminRouter.get("/user", verifyAdminKey, UserController.read)
adminRouter.post("/user", AuthController.signup)
adminRouter.put("/user", verifyAdminKey, UserController.update)
adminRouter.delete("/user", verifyAdminKey, AuthController.deleteAccount)

adminRouter.post("/session", AuthController.login)

adminRouter.get("/categories", verifyAdminKey, ServiceController.readCategories)
adminRouter.post(
  "/categories",
  verifyAdminKey,
  body("name").exists().isLength({ min: 1 }).withMessage("Giv venligst kategorien et navn"),
  ServiceController.createCategory
)
adminRouter.put(
  "/categories/:id",
  verifyAdminKey,
  body("name").exists().isLength({ min: 1 }).withMessage("Specificer venligst en opdatering"),
  ServiceController.updateCategory
)
adminRouter.delete(
  "/categories/:id",
  verifyAdminKey,
  body("id").isLength({ min: 1 }).withMessage("Specificer venligst en kategori at slette"),
  ServiceController.deleteCategory
)

adminRouter.get("/services", verifyAdminKey, ServiceController.index)
adminRouter.post(
  "/services",
  verifyAdminKey,
  body("name").exists().isLength({ min: 1 }).withMessage("Giv venligst servicen et navn"),
  body("minutesTaken").exists().isNumeric().withMessage("Specificer venligst hvor langt tid servicen tager"),
  body("onlineBooking").exists().isBoolean().withMessage("Specificer venligst om online booking bør være muligt"),
  ServiceController.create
)
adminRouter.put(
  "/services/:id",
  verifyAdminKey,
  body("new.name").exists().isLength({ min: 1 }).withMessage("Giv venligst servicen et navn"),
  body("new.minutesTaken").exists().isNumeric().withMessage("Specificer venligst hvor langt tid servicen tager"),
  body("new.onlineBooking").exists().isBoolean().withMessage("Specificer venligst om online booking bør være muligt"),
  ServiceController.update
)
adminRouter.delete("/services/:id", verifyAdminKey, ServiceController.delete)

adminRouter.get("/employees", verifyAdminKey, CalendarController.read)
adminRouter.post("/employees", verifyAdminKey, CalendarController.create)
adminRouter.put("/employees/:id", verifyAdminKey, CalendarController.update)
adminRouter.delete("/employees/:id", verifyAdminKey, CalendarController.delete)

adminRouter.get("/customers", verifyAdminKey, CustomerController.read)

adminRouter.get("/appointments", verifyAdminKey, AppointmentController.readInterval)

adminRouter.use(productsRouter)

// LEGACY
adminRouter.use("/auth", authRouter)
adminRouter.use("/customer", customerRouter)
adminRouter.use("/calendar", calendarRouter)
adminRouter.use("/appointment", appointmentRouter)
adminRouter.use("/settings", settingsRouter)
adminRouter.use("/app-store", appStoreRouter)
adminRouter.use("/pay", payRouter)
