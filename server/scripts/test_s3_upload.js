require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

async function main() {
  const bucket = process.env.AWS_BUCKET_NAME || process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || 'eu-north-1';

  if (!bucket) {
    console.error('AWS bucket not configured in .env (AWS_BUCKET_NAME or S3_BUCKET_NAME)');
    process.exit(2);
  }

  const s3Config = { region };
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    s3Config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  const client = new S3Client(s3Config);

  // 1x1 PNG (very small)
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
  const buffer = Buffer.from(pngBase64, 'base64');

  const key = `test-upload-${Date.now()}.png`;

  const params = {
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ACL: 'public-read',
    ContentType: 'image/png',
  };

  try {
    console.log(`Uploading test image to s3://${bucket}/${key} (region=${region})`);
    try {
      await client.send(new PutObjectCommand(params));
    } catch (err) {
      // Some buckets disallow ACLs (Bucket owner enforced). Retry without ACL.
      const msg = err && err.message ? err.message.toLowerCase() : '';
      if (msg.includes('does not allow acls') || msg.includes('acl')) {
        console.log('Bucket rejected ACLs; retrying upload without ACL...');
        delete params.ACL;
        await client.send(new PutObjectCommand(params));
      } else {
        throw err;
      }
    }

    const url = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
    console.log('Upload successful. File URL:');
    console.log(url);
    process.exit(0);
  } catch (err) {
    console.error('Upload failed:', err && err.message ? err.message : err);
    process.exit(3);
  }
}

main();
