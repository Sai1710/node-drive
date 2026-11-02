import { Message, SQSClient } from "@aws-sdk/client-sqs";
import awsConfiguration from "../config/aws.configuration";
import { Consumer } from "sqs-consumer";
import { fileModel } from "@sakiriti/drive-common";

const handleMessage = async (m: Message) => {
  if (m.Body) {
    const messageObj = JSON.parse(m.Body).Records[0];
    console.log("1", messageObj, messageObj.eventName === "ObjectCreated:Put");
    if (messageObj.eventName.startsWith("ObjectCreated:")) {
      const createdFile = messageObj.s3.object;
      const dbFile = await fileModel.findById(createdFile.key);
      if (dbFile) {
        dbFile.status = "uploaded";
        dbFile.s3_key = createdFile.key;
        await dbFile.save();
      }
    }
  }
  return m;
};

const runFileStatusConsumer = async (sqsClient: SQSClient) => {
  const { QueueUrl } = await awsConfiguration.getQueueUrl("file-notification");
  if (QueueUrl) {
    const consumer = Consumer.create({
      queueUrl: QueueUrl,
      handleMessage: handleMessage,
      sqs: sqsClient,
    });
    consumer.start();

    consumer.on("error", (err, msg) => console.error("sqs error", err.message));

    consumer.on("processing_error", (err, msg) =>
      console.error("handler error", err.message, msg?.MessageId)
    );
    consumer.on("message_processed", (msg) =>
      console.log("deleted", msg.MessageId)
    );
  }
};

export default runFileStatusConsumer;
