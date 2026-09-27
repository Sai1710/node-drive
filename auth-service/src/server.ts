import appConfiguration from "./config/app.configuration";
import { PORT } from "./config/env.configuration";
import { connectToDB } from "./database/connection/dbConnect";

const startApp = async () => {
  const app = appConfiguration.app;
  connectToDB();
  app.listen(PORT, () => {
    console.log(`App is listening on Port ${PORT}`);
  });
};
+startApp();
