import App from "./config/app.configuration";
import { PORT } from "./config/env.configuration";
import { connectToDB } from "./database/dbConnect";

const startApp = () => {
  const appConfiguration = new App();
  const app = appConfiguration.app;

  connectToDB();

  app.listen(PORT, () => {
    console.log(`App is listening on Port ${PORT}`);
  });
};

startApp();
