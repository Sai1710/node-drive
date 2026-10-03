import dotenv from "dotenv";
dotenv.config();

const env = process.env;
export const PORT = env.PORT;
export const MONGODB_URI = env.MONGODB_URI;
export const REFRESH_TOKEN_SECRET = env.REFRESH_TOKEN_SECRET;
export const ACCESS_TOKEN_SECRET = env.ACCESS_TOKEN_SECRET;
