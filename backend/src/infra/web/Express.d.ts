import type { TokenPayload } from "../../domain/authentication/interfaces/TokenPayload.ts";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export {};
