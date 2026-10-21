const express = require("express");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { R2_BUCKET_NAME, r2Client, getViewUrl } = require("../../r2/config");

const router = express.Router();
const sanitizeName = (value) => String(value || "file")
  .replace(/\s+/g, "-")
  .replace(/[^a-zA-Z0-9._-]/g, "");

router.post("/presign", async (req, res) => {
  try {
    const files = Array.isArray(req.body.files) ? req.body.files : [];
    const data = await Promise.all(files.map(async (file) => {
      const key = `${Date.now()}-${sanitizeName(file.name)}`;
      const contentType = file.contentType || "application/octet-stream";
      const url = await getSignedUrl(
        r2Client,
        new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key, ContentType: contentType }),
        { expiresIn: 3600 }
      );
      const view_url = getViewUrl(key);
      return { key, url, view_url, publicUrl: view_url };
    }));
    return res.json({ success: true, data });
  } catch (error) {
    console.error("R2 presign error:", error);
    return res.status(500).json({ success: false, message: error.message || "Presign failed" });
  }
});

module.exports = router;
