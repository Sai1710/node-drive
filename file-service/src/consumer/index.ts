import runFileStatusConsumer from "./fileStatusConsumer";
import awsConfiguration from "../config/aws.configuration";

export const runSqsConsumer = async () => {
  const sqsClient = awsConfiguration.sqsClient;
  await runFileStatusConsumer(sqsClient);
};
