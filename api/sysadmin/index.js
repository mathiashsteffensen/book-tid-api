const express = require('express')
const cors = require('cors')

const {
    verifyPassword,
    createToken,
    verifyToken
} = require('../../utils')

const {
    AdminClient
} = require('../../db/models/models')

const sysadminRouter = express.Router()

const sysadmin = {
    username: process.env.SYSADMIN_USERNAME,
    password: process.env.SYSADMIN_PASSWORD_HASH
}

const whitelist = ['https://sysadmin.booktid.net', 'http://localhost:8080']
var corsOptionsDelegate = function (req, callback) {
  const corsOptions = {
      methods: ["GET", "PUT", "POST", "DELETE", "HEAD", "PATCH"],
      allowedHeaders: ["Content-Type", "content-type"],
  };
  if (whitelist.indexOf(req.header('Origin')) !== -1) {
      corsOptions.origin = true
  } else {
      corsOptions.origin = false
  }
  callback(null, corsOptions);
}

sysadminRouter.use(cors(corsOptionsDelegate))

sysadminRouter.post('/login', async (req, res, next) => {
    try {
        const {
            username,
            password
        } = req.body

        if (username !== sysadmin.username) throw new Error("Wrong username or password")

        const valid = await verifyPassword(password, sysadmin.password)

        if (!valid) throw new Error("Wrong username or password")

        const token = createToken(sysadmin)

        res.json({ token })

    } catch(err) {
        next({msg: err.message, stack: err.stack})
    }
})

sysadminRouter.get('/verify-key/:apiKey', async (req, res, next) => {
    try {
        const payload = await verifyToken(req.params.apiKey)

        if (sysadmin.password !== payload.password || sysadmin.username !== payload.username) {
            res.status(401)
            throw new Error("No")
        }

        res.send()
    } catch (err) {
        next({msg: err.message, stack: err.stack})
    }
})

sysadminRouter.get('/all-users/:apiKey', async (req, res, next) => {
    try {
        const payload = await verifyToken(req.params.apiKey)

        if (sysadmin.password !== payload.password || sysadmin.username !== payload.username) {
            res.status(401)
            throw new Error("No")
        }

        const numberOfUsers = await AdminClient.countDocuments().exec()

        const users = await AdminClient.find().select("-bookingSettings.personalDataPolicy").limit(100).exec()

        res.json({
            numberOfUsers,
            users
        })
    } catch (err) {
        next({msg: err.message, stack: err.stack})
    }
})

module.exports = sysadminRouter