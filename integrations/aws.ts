import AWS from "aws-sdk"
import multer from "multer"
import multerS3 from "multer-s3"
import { MyRequest } from "types"

const spacesEndpoint = new AWS.Endpoint("ams3.digitaloceanspaces.com")

const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_BUCKET_ACCESS_KEY,
  secretAccessKey: process.env.DO_BUCKET_SECRET_KEY
})

const limits = {
  files: 1, // allow only 1 file per request
  fileSize: 1024 * 1024, // 1 MB (max file size)
}

export const upload = multer({
  storage: multerS3({
    s3: s3,
    acl:"public-read",
    bucket: process.env.DO_BUCKET_NAME,
    key: (req: MyRequest, file, cb) => {
      cb(null, Date.now().toString() + "-" + req.params.calendarID + "-" + file.originalname)
    }
  }),
  limits: limits,
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
      cb(null, true)
    } else {
      cb(null, false)
      return cb(new Error("Alle profilbillede uploads skal være af formatet .png, .jpeg eller .jpg"))
    }
  }
})

export const remove = async (pictureURL) => {
  const Key = pictureURL.slice(46)
  const params = {
    Key,
    Bucket: process.env.DO_BUCKET_NAME 
  }
  s3.deleteObject(params, (err) => {
    if (err) throw new Error("Der skete en fejl, prøv venligst igen")
  })
}
