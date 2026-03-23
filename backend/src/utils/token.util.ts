import jwt from "jsonwebtoken";
import { HttpException } from "./AppException.js";
import type { TokenPayload } from "./TokenPayload.js";
import crytoExt from "crypto";
import ms from "ms";

export class TokenUtil {
  static generateAccessToken(payload: TokenPayload): string {
    const secret = process.env.JWT_ACCESS_SECRET as string;
    const expiresIn = (process.env.JWT_ACCESS_EXPIRES_IN ||
      "15m") as ms.StringValue;
    return jwt.sign(payload, secret, { expiresIn });
  }

  static generateRefreshToken(payload: TokenPayload): string {
    const secret = process.env.JWT_REFRESH_SECRET as string;
    const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ||
      "7d") as ms.StringValue;
    return jwt.sign({ ...payload }, secret, { expiresIn });
  }

  static verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);

      if (typeof decoded === "object" && decoded !== null) {
        return decoded as TokenPayload;
      }

      throw new Error("Payload invalide");
    } catch (error) {
      throw new HttpException(401, "Token invalide ou expiré");
    }
  }

  static verifyRefreshToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
      if (typeof decoded === "object" && decoded !== null) {
        return decoded as TokenPayload;
      }
      throw new Error("Payload invalide");
    } catch {
      throw new HttpException(401, "Token invalide ou expiré");
    }
  }

  static generateRandomToken(): string {
    return crytoExt.randomBytes(32).toString("hex");
  }
}
