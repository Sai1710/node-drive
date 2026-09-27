import mongoose from "mongoose";
import userSchema from "../schemas/user.schema";

const userModel = mongoose.model("User", userSchema);

export default userModel;
