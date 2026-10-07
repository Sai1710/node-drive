import mongoose, { Model } from "mongoose";
import userSchema from "../schemas/user.schema";
import { TUser, TUserMethods } from "../../types/user.types";

const userModel = mongoose.model<TUser, Model<TUser, {}, TUserMethods>>(
  "User",
  userSchema,
);

export default userModel;
