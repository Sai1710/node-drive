import dotenv from "dotenv";
dotenv.config();

const env = process.env;
export const PORT = env.PORT;
export const MONGODB_URI = env.MONGODB_URI;
export const ACCESS_TOKEN_SECRET = env.ACCESS_TOKEN_SECRET;
export const AWS_ACCESS_KEY = env.AWS_ACCESS_KEY;
export const AWS_SECRET_ACCESS_KEY = env.AWS_SECRET_ACCESS_KEY;
export const AWS_BUCKET = env.AWS_BUCKET;
