import { S3Client } from "@aws-sdk/client-s3";
import { AWS_ACCESS_KEY, AWS_SECRET_ACCESS_KEY } from "./env.configuration";

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: AWS_ACCESS_KEY || "",
    secretAccessKey: AWS_SECRET_ACCESS_KEY || "",
  },
});

export default s3Client;
