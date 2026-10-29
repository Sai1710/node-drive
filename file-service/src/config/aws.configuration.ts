import { S3Client } from "@aws-sdk/client-s3";
import { AWS_ACCESS_KEY, AWS_SECRET_ACCESS_KEY } from "./env.configuration";
import { GetQueueUrlCommand, SQSClient } from "@aws-sdk/client-sqs";

class AWSClient {
  s3Client: S3Client;
  sqsClient: SQSClient;

  constructor() {
    this.s3Client = new S3Client({
      region: "ap-south-1",
      credentials: {
        accessKeyId: AWS_ACCESS_KEY || "",
        secretAccessKey: AWS_SECRET_ACCESS_KEY || "",
      },
    });
    this.sqsClient = new SQSClient({
      region: "ap-south-1",
      credentials: {
        accessKeyId: AWS_ACCESS_KEY || "",
        secretAccessKey: AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }

  public async getQueueUrl(queueName: string) {
    const getQueueUrlCommand = new GetQueueUrlCommand({ QueueName: queueName });
    return await this.sqsClient.send(getQueueUrlCommand);
  }
}

export default new AWSClient();
