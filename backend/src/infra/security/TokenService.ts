import jwt, { type SignOptions } from "jsonwebtoken";
import type { TokenPayload } from "./TokenPayload.js";
import crytoExt from "crypto";
import ms from "ms";
import { envConfig } from "../config/EnvConfig.js";
import type { ITokenService } from "../../modules/auth/ITokenService.js";
import { UnauthenticatedError } from "../exceptions/UnauthenticatedError.js";

export class TokenService implements ITokenService {
  generateAccessToken(payload: TokenPayload): string {
    const accessSecret = envConfig.jwtAccessSecret;

    const options: SignOptions = {
      expiresIn: envConfig.jwtAccessExpiration! as ms.StringValue,
    };

    return jwt.sign(payload, accessSecret, options);
  }

  generateRefreshToken(payload: TokenPayload): string {
    const refreshSecret = envConfig.jwtRefreshSecret;
    const options: SignOptions = {
      expiresIn: envConfig.jwtRefreshExpiration! as ms.StringValue,
    };

    return jwt.sign({ ...payload }, refreshSecret, options);
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, envConfig.jwtAccessSecret!);

      if (typeof decoded === "object" && decoded !== null) {
        return decoded as TokenPayload;
      }

      throw new UnauthenticatedError();
    } catch (error) {
      throw new UnauthenticatedError();
    }
  }

  verifyRefreshToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, envConfig.jwtRefreshSecret!);
      if (typeof decoded === "object" && decoded !== null) {
        return decoded as TokenPayload;
      }
      throw new UnauthenticatedError();
    } catch {
      throw new UnauthenticatedError();
    }
  }

   generateRandomToken(): string {
    return crytoExt.randomBytes(32).toString("hex");
  } 
}
