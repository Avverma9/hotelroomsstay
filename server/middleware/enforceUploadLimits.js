// Middleware to validate upload counts and total size after multer
module.exports = function enforceUploadLimits(opts = {}) {
  const { maxFiles = 20, maxTotalSizeBytes = 50 * 1024 * 1024 } = opts; // defaults: 20 files, 50MB total

  return (req, res, next) => {
    try {
      const files = req.files || [];
      if (files.length > maxFiles) {
        return res.status(400).json({ message: `Too many files. Maximum allowed is ${maxFiles}.` });
      }

      const total = files.reduce((s, f) => s + (f.size || 0), 0);
      if (total > maxTotalSizeBytes) {
        return res.status(400).json({ message: `Total upload size exceeds limit (${Math.round(maxTotalSizeBytes / 1024 / 1024)} MB).` });
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
};
