import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
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
  },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (
  password: string,
): Promise<boolean> {
  return await bcrypt.compare(this.password, password);
};

userSchema.methods.generateAccessToken = function (accessTokenSecret: string) {
  return jwt.sign({ id: this._id }, accessTokenSecret, {
    expiresIn: "15m",
  });
};

userSchema.methods.generateRefreshToken = function (
  refreshTokenSecret: string,
) {
  return jwt.sign({ id: this._id }, refreshTokenSecret, {
    expiresIn: "24h",
  });
};

userSchema.methods.validateRefreshToken = function (inputToken: string) {
  return this.refresh_token === inputToken;
};

export default userSchema;
