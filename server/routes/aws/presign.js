const express = require('express');
const router = express.Router();
const { S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || process.env.S3_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1';

const s3Config = { region: AWS_REGION };
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const s3Client = new S3Client(s3Config);

// POST /presign
// Body: { files: [{ name, contentType }] }
router.post('/presign', async (req, res) => {
  try {
    if (!AWS_BUCKET_NAME) return res.status(500).json({ message: 'S3 bucket not configured' });
    const files = Array.isArray(req.body.files) ? req.body.files : [];
    const results = [];
    for (const f of files) {
      const safeName = String(f.name || 'file').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')
      const key = `${Date.now()}-${safeName}`;
      const contentType = f.contentType || 'application/octet-stream';
      const command = new PutObjectCommand({ Bucket: AWS_BUCKET_NAME, Key: key, ContentType: contentType });
      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      const publicUrl = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${encodeURIComponent(key)}`;
      results.push({ key, url, publicUrl });
    }

    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Presign error:', err);
    res.status(500).json({ success: false, message: err.message || 'Presign failed' });
  }
});

module.exports = router;
