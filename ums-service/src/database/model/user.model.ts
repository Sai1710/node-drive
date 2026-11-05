import mongoose from "mongoose";
import { TUser, TUserModel } from "../../types/user";
import { USER_MODEL_NAME } from "../../constants";
import userSchema from "../schema/user.schema";

const userModel = mongoose.model<TUser, TUserModel>(
  USER_MODEL_NAME,
  userSchema
);

export default userModel;
