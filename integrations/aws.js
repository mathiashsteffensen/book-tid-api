var AWS = require('aws-sdk')
var multer = require('multer')
var multerS3 = require('multer-s3')

var spacesEndpoint = new AWS.Endpoint('ams3.digitaloceanspaces.com')

var s3 = new AWS.S3({
        endpoint: spacesEndpoint,
        accessKeyId: process.env.DO_BUCKET_ACCESS_KEY,
        secretAccessKey: process.env.DO_BUCKET_SECRET_KEY
});

var limits = {
  files: 1, // allow only 1 file per request
  fileSize: 1024 * 1024, // 1 MB (max file size)
};

var upload = multer({
    storage: multerS3({
        s3: s3,
        acl:'public-read',
        bucket: process.env.DO_BUCKET_NAME,
        key: (req, file, cb) => {
          cb(null, Date.now().toString() + '-' + req.params.calendarID + '-' + file.originalname)
        }
    }),
    limits: limits,
    fileFilter: (req, file, cb) => {
      if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") {
        cb(null, true);
      } else {
        cb(null, false);
        return cb(new Error('Alle profilbillede uploads skal være af formatet .png, .jpeg eller .jpg'));
      }
    }
})

let remove = async (pictureURL) =>
{
    let Key = pictureURL.slice(46)
    let params = {
        Key,
        Bucket: process.env.DO_BUCKET_NAME
    }
    s3.deleteObject(params, (err) =>
    {
        if (err) throw new Error('Der skete en fejl, prøv venligst igen')
    })
}

// Exports upload function
module.exports = {
    upload,
    remove
}
