import type { TokenPayload } from "../../domain/authentication/TokenPayload.ts";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export {};
