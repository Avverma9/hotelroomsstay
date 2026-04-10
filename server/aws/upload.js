const fs = require("fs");
const path = require("path");
const { S3Client } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
const multer = require("multer");
require("dotenv").config();

const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || process.env.S3_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION || "eu-north-1";
const PORT = process.env.PORT || 5000;
const PUBLIC_BASE_URL =
  process.env.SERVER_PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const LOCAL_UPLOAD_DIR = path.join(__dirname, "..", "uploads");

const s3Config = { region: AWS_REGION };
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const s3 = new S3Client(s3Config);

const ensureLocalUploadDir = () => {
  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
    fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  }
};

const normalizeLocalFileLocation = (file) => {
  if (!file) return file;
  if (!file.location && file.filename) {
    file.location = `${PUBLIC_BASE_URL}/uploads/${file.filename}`;
  }
  return file;
};

const createLocalUploadMiddleware = () => {
  ensureLocalUploadDir();

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, LOCAL_UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      const safeOriginalName = String(file.originalname || "file")
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9._-]/g, "");
      cb(null, `${Date.now()}-${safeOriginalName}`);
    },
  });

  const middleware = multer({
    storage,
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type. Only images are allowed."));
      }
    },
  }).any();

  return (req, res, next) => {
    middleware(req, res, (error) => {
      if (error) return next(error);
      if (Array.isArray(req.files)) {
        req.files = req.files.map(normalizeLocalFileLocation);
      }
      next();
    });
  };
};

const createS3UploadMiddleware = () => {
  const middleware = multer({
    storage: multerS3({
      s3,
      bucket: AWS_BUCKET_NAME,
      acl: "public-read",
      key: function (_req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type. Only images are allowed."));
      }
    },
  }).any();

  return middleware;
};

if (!AWS_BUCKET_NAME) {
  console.warn(
    "AWS bucket is not configured. Falling back to local uploads in /server/uploads.",
  );
}

const upload = AWS_BUCKET_NAME
  ? createS3UploadMiddleware()
  : createLocalUploadMiddleware();

module.exports.upload = upload;
