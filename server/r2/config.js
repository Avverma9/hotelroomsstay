const { S3Client } = require("@aws-sdk/client-s3");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "hotelroomsstay";
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_VIEW_URL = (process.env.R2_VIEW_URL || "").replace(/\/$/, "");

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_VIEW_URL) {
  throw new Error(
    "Cloudflare R2 is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_VIEW_URL."
  );
}

const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const getViewUrl = (key) => `${R2_VIEW_URL}/${String(key).split("/").map(encodeURIComponent).join("/")}`;

module.exports = { R2_BUCKET_NAME, R2_VIEW_URL, r2Client, getViewUrl };
