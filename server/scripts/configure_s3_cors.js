require('dotenv').config();
const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');

const bucket = process.env.AWS_BUCKET_NAME || process.env.S3_BUCKET_NAME;
const region = process.env.AWS_REGION || 'ap-south-1';

if (!bucket) {
  throw new Error('AWS_BUCKET_NAME or S3_BUCKET_NAME must be configured.');
}

const client = new S3Client({ region });

async function configureCors() {
  await client.send(new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: {
      CORSRules: [{
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'HEAD', 'PUT'],
        AllowedOrigins: (process.env.S3_ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174')
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 3000,
      }],
    },
  }));

  console.log(`S3 CORS configured for ${bucket} in ${region}.`);
}

configureCors().catch((error) => {
  console.error('Unable to configure S3 CORS:', error.message);
  process.exitCode = 1;
});