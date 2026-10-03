import { HydratedDocument, InferSchemaType } from "mongoose";
import userSchema from "../database/schemas/user.schema";

export type TUser = InferSchemaType<typeof userSchema>;

export type TUserMethods = {
  comparePassword: (inputPassword: string) => Promise<boolean>;
  generateAccessToken: (accessTokenSecret: string) => string;
  generateRefreshToken: (refreshTokenSecret: string) => string;
  validateRefreshToken: (refreshToken: string) => boolean;
};

export type TUserDocument = HydratedDocument<TUser, TUserMethods>;
