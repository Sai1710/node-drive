import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import { asyncHandler } from "../../utils/asyncHandler";
import { ACCESS_TOKEN_SECRET } from "../../config/env.configuration";
import { ApiError } from "../../utils/ApiError";
import userModel from "../../database/models/user.model";

class AuthMiddleware {
  validateToken = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const accessToken = req.headers["Authorization"]?.[0]?.replace(
        "Bearer ",
        "",
      );
      if (!accessToken) {
        throw new ApiError(401, "Invalid access token");
      }

      if (!ACCESS_TOKEN_SECRET) {
        throw new ApiError(500, "Something went wrong.");
      }

      const decodedUser = jwt.verify(
        accessToken,
        ACCESS_TOKEN_SECRET,
      ) as JwtPayload;

      const user = await userModel.findById(decodedUser._id);

      if (!user) {
        throw new ApiError(401, "Invalid access token");
      }

      req.user = user;
      next();
    },
  );
}

export default new AuthMiddleware();
