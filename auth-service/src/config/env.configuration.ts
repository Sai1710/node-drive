import dotenv from "dotenv";
dotenv.config();

const env = process.env;
export const PORT = env.PORT;
export const MONGODB_URI = env.MONGODB_URI;
