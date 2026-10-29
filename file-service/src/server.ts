import appConfiguration from "./config/app.configuration";
import { PORT } from "./config/env.configuration";
import { runSqsConsumer } from "./consumer";
import { connectToDB } from "./database/connection/dbConnect";

const startApp = () => {
  const app = appConfiguration.app;
  connectToDB();
  runSqsConsumer();
  app.listen(PORT, () => {
    console.log("App is listening on port:", PORT);
  });
};

startApp();
