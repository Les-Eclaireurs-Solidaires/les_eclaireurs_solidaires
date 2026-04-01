import type { TokenPayload } from "../security/TokenPayload.ts";


declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export { };