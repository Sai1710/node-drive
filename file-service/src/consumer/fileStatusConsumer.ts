import { SQSClient } from "@aws-sdk/client-sqs";
import awsConfiguration from "../config/aws.configuration";
import { Consumer } from "sqs-consumer";

const runFileStatusConsumer = async (sqsClient: SQSClient) => {
  const { QueueUrl } = await awsConfiguration.getQueueUrl("file-notification");
  if (QueueUrl) {
    const consumer = Consumer.create({
      queueUrl: QueueUrl,
      handleMessage: async (m) => {
        console.log({ m });
      },
      sqs: sqsClient,
    });
    consumer.start();
  }
};

export default runFileStatusConsumer;
