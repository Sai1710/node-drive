import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import userModel from "../../database/models/user.model";
import { TUserDocument } from "../../types/user.types";
import {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
} from "../../config/env.configuration";

class AuthControllers {
  signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Email and password are mandatory");
    }

    const doesEmailExist = await userModel.exists({
      email,
    });

    if (doesEmailExist) {
      throw new ApiError(409, "User with this email already exists");
    }

    const createdUser = await userModel.create({
      email,
      password,
    });

    res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User registered successfully"));
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const existingUser: TUserDocument | null = await userModel.findOne({
      email,
    });

    if (!existingUser?._id) {
      throw new ApiError(401, "No user exists with this email");
    }

    const doesPasswordMatch = existingUser.comparePassword(password);

    if (!doesPasswordMatch) {
      throw new ApiError(401, "Invalid Password");
    }

    if (!REFRESH_TOKEN_SECRET || !ACCESS_TOKEN_SECRET) {
      throw new ApiError(500, "Something went wrong");
    }

    const refreshToken =
      existingUser.generateRefreshToken(REFRESH_TOKEN_SECRET);
    const accessToken = existingUser.generateAccessToken(ACCESS_TOKEN_SECRET);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { access_token: accessToken, refresh_token: refreshToken },
          "Login successful",
        ),
      );
  });

  refreshSession = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { refresh_token } = req.body;
      if (!refresh_token) {
        throw new ApiError(400, "Refresh token is required");
      }
      if (!REFRESH_TOKEN_SECRET || !ACCESS_TOKEN_SECRET) {
        throw new ApiError(500, "Soemthing went wrong");
      }

      const decodedUser = jwt.verify(
        refresh_token,
        REFRESH_TOKEN_SECRET,
      ) as JwtPayload;

      if (!decodedUser?._id) {
        throw new ApiError(401, "Session expired");
      }

      const userId = decodedUser._id;
      const user = await userModel.findById(userId);
      const isRefreshTokenValid = user?.validateRefreshToken(refresh_token);

      if (!isRefreshTokenValid) {
        throw new ApiError(401, "Refresh token doesnt match");
      }
      const accessToken = user?.generateAccessToken(ACCESS_TOKEN_SECRET);

      res.status(200).json(new ApiResponse(200, { access_token: accessToken }));
    },
  );

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await userModel.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          refresh_token: null,
        },
      },
      { new: true },
    );
    res.status(200).json(new ApiResponse(200, {}, "Logged out successfully"));
  });
}

export default new AuthControllers();
