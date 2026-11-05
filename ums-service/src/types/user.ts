import { HydratedDocument, Model } from "mongoose";

export type TUser = {
  email: string;
  password: string;
  refresh_token: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TUserMethods = {
  comparePassword: (inputPassword: string) => Promise<boolean>;
  generateAccessToken: (accessTokenSecret: string) => string;
  generateRefreshToken: (refreshTokenSecret: string) => string;
  validateRefreshToken: (refreshToken: string) => boolean;
};

export type TUserModel = Model<TUser, {}, TUserMethods>;

export type TUserDocument = HydratedDocument<TUser, TUserMethods>;

export type TPublicUser = Omit<TUser, "password" | "refresh_token"> & {
  _id: string;
};
