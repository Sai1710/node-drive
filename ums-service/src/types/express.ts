import { TAccessTokenPayload } from "./auth";
import { TUserDocument } from "./user";

declare global {
  namespace Express {
    export interface Request {
      auth?: TAccessTokenPayload;
      user?: TUserDocument;
    }
  }
}

export {};
