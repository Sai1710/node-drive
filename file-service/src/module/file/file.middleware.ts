import { ApiError, asyncHandler, TUserDocument } from "@sakiriti/drive-common";
import { NextFunction, Request, Response } from "express";
import { ACCESS_TOKEN_SECRET } from "../../config/env.configuration";
import jwt, { JwtPayload } from "jsonwebtoken";

class FileMiddleware {
  validateToken = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const accessToken = req.headers["authorization"]?.replace("Bearer ", "");
      console.log(req.headers, { accessToken });
      if (!accessToken) {
        throw new ApiError(401, "Invalid access token");
      }

      if (!ACCESS_TOKEN_SECRET) {
        throw new ApiError(500, "Something went wrong.");
      }

      const decodedUser = jwt.verify(
        accessToken,
        ACCESS_TOKEN_SECRET
      ) as JwtPayload;

      req.user = decodedUser as TUserDocument;
      next();
    }
  );
}

export default new FileMiddleware();
