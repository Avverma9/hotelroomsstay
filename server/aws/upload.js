const { S3Client } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
const multer = require("multer");
const AWS_BUCKET_NAME = "happy-stay-hopspitiality";
const AWS_ACCESS_KEY_ID = "AKIAX3DNHWL2NL4YPLUL";
const AWS_SECRET_ACCESS_KEY = "555f4HBPMcslvv1drMqIx0UkrmM0MJm844jHUGBk";
const AWS_REGION = "eu-north-1"; // Update this to the appropriate region for your S3 bucket
const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: AWS_BUCKET_NAME,
    acl: "public-read",
    key: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images are allowed."));
    }
  },
}).any(); // Accept files from any field name

module.exports.upload = upload;
