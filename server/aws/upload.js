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

const DEFAULT_MAX_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_FILE_SIZE, 10) || 5 * 1024 * 1024; // 5 MB
const DEFAULT_MAX_FILES = parseInt(process.env.MAX_UPLOAD_FILES, 10) || 20;

const sanitizeName = (value) =>
  String(value || "file")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");

const imageFileFilter = (_req, file, cb) => {
  if (file?.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
    return;
  }
  cb(new Error("Invalid file type. Only images are allowed."));
};

const toUploadErrorResponse = (error) => {
  if (!error) return null;

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return { status: 400, message: "File too large. Maximum file size limit exceeded." };
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return { status: 400, message: "Too many files uploaded." };
    }
    return { status: 400, message: error.message || "Upload validation failed." };
  }

  return { status: 400, message: error.message || "Upload failed." };
};

const wrapMulterMiddleware = (middleware) =>
  (req, res, next) => {
    middleware(req, res, (error) => {
      if (error) {
        const mapped = toUploadErrorResponse(error);
        if (mapped) {
          return res.status(mapped.status).json({ message: mapped.message });
        }
        return next(error);
      }

      if (Array.isArray(req.files)) {
        req.files = req.files.map(normalizeLocalFileLocation);
      }

      return next();
    });
  };

const createLocalUploadMiddleware = (options = {}) => {
  ensureLocalUploadDir();

  const { maxFileSize = DEFAULT_MAX_FILE_SIZE, maxFiles = DEFAULT_MAX_FILES } = options;

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, LOCAL_UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      const safeOriginalName = sanitizeName(file.originalname);
      cb(null, `${Date.now()}-${safeOriginalName}`);
    },
  });

  const middleware = multer({
    storage,
    limits: { fileSize: maxFileSize, files: maxFiles },
    fileFilter: imageFileFilter,
  }).any();

  return wrapMulterMiddleware(middleware);
};

const createS3UploadMiddleware = (options = {}) => {
  const { maxFileSize = DEFAULT_MAX_FILE_SIZE, maxFiles = DEFAULT_MAX_FILES } = options;

  const middleware = multer({
    storage: multerS3({
      s3,
      bucket: AWS_BUCKET_NAME,
      // Note: Do not set ACL by default. Some buckets enforce "Bucket owner enforced" and reject ACLs.
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: function (_req, file, cb) {
        cb(null, `${Date.now()}-${sanitizeName(file.originalname)}`);
      },
    }),
    limits: { fileSize: maxFileSize, files: maxFiles },
    fileFilter: imageFileFilter,
  }).any();

  return wrapMulterMiddleware(middleware);
};

if (!AWS_BUCKET_NAME) {
  console.warn(
    "AWS bucket is not configured. Falling back to local uploads in /server/uploads.",
  );
}

const createUploadMiddleware = (options = {}) => {
  if (AWS_BUCKET_NAME) {
    return createS3UploadMiddleware(options);
  }
  return createLocalUploadMiddleware(options);
};

const upload = createUploadMiddleware();

module.exports.upload = upload;
module.exports.createUploadMiddleware = createUploadMiddleware;
