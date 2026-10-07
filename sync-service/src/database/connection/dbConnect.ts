import mongoose from "mongoose";
import { MONGODB_URI } from "../../config/env.configuration";

export const connectToDB = async () => {
  try {
    if (MONGODB_URI) await mongoose.connect(MONGODB_URI);
    console.log("Database is connected");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
