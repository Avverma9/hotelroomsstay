const multer = require("multer");
const multerS3 = require("multer-s3");
const { R2_BUCKET_NAME, r2Client, getViewUrl } = require("./config");

const DEFAULT_MAX_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_FILE_SIZE, 10) || 5 * 1024 * 1024;
const DEFAULT_MAX_FILES = parseInt(process.env.MAX_UPLOAD_FILES, 10) || 20;

const sanitizeName = (value) => String(value || "file")
  .replace(/\s+/g, "-")
  .replace(/[^a-zA-Z0-9._-]/g, "");

const imageFileFilter = (_req, file, cb) => {
  if (file?.mimetype?.startsWith("image/")) return cb(null, true);
  return cb(new Error("Invalid file type. Only images are allowed."));
};

const toUploadErrorResponse = (error) => {
  if (!error) return null;
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") return { status: 400, message: "File too large. Maximum file size limit exceeded." };
    if (error.code === "LIMIT_FILE_COUNT") return { status: 400, message: "Too many files uploaded." };
    return { status: 400, message: error.message || "Upload validation failed." };
  }
  return { status: 400, message: error.message || "Upload failed." };
};

const wrapMulterMiddleware = (middleware) => (req, res, next) => {
  middleware(req, res, (error) => {
    if (error) {
      const mapped = toUploadErrorResponse(error);
      return mapped ? res.status(mapped.status).json({ message: mapped.message }) : next(error);
    }
    if (Array.isArray(req.files)) {
      req.files = req.files.map((file) => {
        const viewUrl = file.view_url || getViewUrl(file.key);
        return { ...file, view_url: viewUrl, location: viewUrl };
      });
    }
    return next();
  });
};

const createUploadMiddleware = (options = {}) => {
  const { maxFileSize = DEFAULT_MAX_FILE_SIZE, maxFiles = DEFAULT_MAX_FILES } = options;
  const middleware = multer({
    storage: multerS3({
      s3: r2Client,
      bucket: R2_BUCKET_NAME,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (_req, file, cb) => cb(null, `${Date.now()}-${sanitizeName(file.originalname)}`),
    }),
    limits: { fileSize: maxFileSize, files: maxFiles },
    fileFilter: imageFileFilter,
  }).any();
  return wrapMulterMiddleware(middleware);
};

const upload = createUploadMiddleware();
module.exports = { upload, createUploadMiddleware };
