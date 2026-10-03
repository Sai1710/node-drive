import { TUserDocument } from "./user.types";

declare global {
  namespace Express {
    export interface Request {
      user?: TUserDocument;
    }
  }
}

export {};
