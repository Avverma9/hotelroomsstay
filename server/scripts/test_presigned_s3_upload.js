require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const bucket = process.env.AWS_BUCKET_NAME || process.env.S3_BUCKET_NAME;
const region = process.env.AWS_REGION || 'ap-south-1';

if (!bucket) throw new Error('AWS_BUCKET_NAME or S3_BUCKET_NAME must be configured.');

async function upload() {
  const client = new S3Client({ region });
  const key = `presigned-upload-test-${Date.now()}.txt`;
  const contentType = 'text/plain';
  const url = await getSignedUrl(client, new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  }), { expiresIn: 60 });

  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: 'Presigned PUT verification',
  });

  if (!response.ok) throw new Error(await response.text());
  console.log(`Presigned PUT succeeded: s3://${bucket}/${key}`);
}

upload().catch((error) => {
  console.error('Presigned PUT failed:', error.message);
  process.exitCode = 1;
});