import { S3Client } from "@aws-sdk/client-s3";

let bucket: S3Client | undefined;
let bucketName: string | undefined;

if(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME) {  
  bucket = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  bucketName = process.env.R2_BUCKET_NAME;
}

export { bucket, bucketName };