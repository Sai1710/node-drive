import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { TUser, TUserMethods, TUserModel } from "../../types/user";
import {
  ACCESS_TOKEN_EXPIRY,
  PASSWORD_SALT_ROUNDS,
  REFRESH_TOKEN_EXPIRY,
} from "../../constants";

const userSchema = new mongoose.Schema<TUser, TUserModel, TUserMethods>(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    refresh_token: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Partial<TUser>) => {
        delete ret.password;
        delete ret.refresh_token;
        return ret;
      },
    },
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, PASSWORD_SALT_ROUNDS);
});

userSchema.method(
  "comparePassword",
  async function (inputPassword: string): Promise<boolean> {
    return await bcrypt.compare(inputPassword, this.password);
  }
);

userSchema.method(
  "generateAccessToken",
  function (accessTokenSecret: string): string {
    return jwt.sign(
      { _id: this._id.toString(), email: this.email },
      accessTokenSecret,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  }
);

userSchema.method(
  "generateRefreshToken",
  function (refreshTokenSecret: string): string {
    return jwt.sign({ _id: this._id.toString() }, refreshTokenSecret, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });
  }
);

userSchema.method(
  "validateRefreshToken",
  function (inputToken: string): boolean {
    return !!this.refresh_token && this.refresh_token === inputToken;
  }
);

export default userSchema;
