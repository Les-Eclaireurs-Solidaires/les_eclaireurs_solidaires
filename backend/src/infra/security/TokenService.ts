import jwt, { type SignOptions } from "jsonwebtoken";
import type { TokenPayload } from "../../domain/authentication/TokenPayload.js";
import crytoExt from "crypto";
import ms from "ms";
import { envConfig } from "../config/EnvConfig.js";
import type { ITokenService } from "../../domain/authentication/ITokenService.js";
import { UnauthenticatedError } from "../exceptions/UnauthenticatedError.js";
import { UserRole } from "../../domain/user/UserRoleEnum.js";
import { InvalidTokenError } from "../../domain/authentication/exceptions/InvalidTokenError.js";

export class TokenService implements ITokenService {
  generateAccessToken(payload: TokenPayload): string {
    const accessSecret = envConfig.jwtAccessSecret;
    if (!Object.values(UserRole).includes(payload.roleId))
      throw new InvalidTokenError();

    const options: SignOptions = {
      expiresIn: envConfig.jwtAccessExpiration! as ms.StringValue,
    };

    return jwt.sign(payload, accessSecret, options);
  }

  generateRefreshToken(payload: TokenPayload): string {
    const refreshSecret = envConfig.jwtRefreshSecret;
    if (!Object.values(UserRole).includes(payload.roleId))
      throw new InvalidTokenError();

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
