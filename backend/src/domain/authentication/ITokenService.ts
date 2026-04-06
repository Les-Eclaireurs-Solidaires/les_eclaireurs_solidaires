import type { TokenPayload } from "./TokenPayload.js";

export interface ITokenService {
  generateAccessToken(payload: any): string;
  generateRefreshToken(payload: any): string;
  verifyAccessToken(token: string): TokenPayload;
  verifyRefreshToken(token: string): TokenPayload;
  generateRandomToken(): string;
}
