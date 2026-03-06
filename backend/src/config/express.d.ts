import { TokenPayload } from "../utils/TokenPayload.ts";


declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export { };