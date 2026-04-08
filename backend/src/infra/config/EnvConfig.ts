import dotenv from "dotenv";

const environment = process.env.BACK_NODE_ENV;
const envFile = environment === "test" ? ".env.test" : ".env";

dotenv.config({ path: envFile });
import type ms from "ms";

export class EnvConfig {
  private static instance: EnvConfig;

  public readonly nodeEnv: string;
  public readonly port: number;
  public readonly host: string;

  public readonly dbHost: string;
  public readonly dbPort: number;
  public readonly dbUser: string;
  public readonly dbPassword: string;
  public readonly dbName: string;

  public readonly jwtAccessSecret: string;
  public readonly jwtRefreshSecret: string;
  public readonly jwtAccessExpiration: string;
  public readonly jwtRefreshExpiration: string;

  private constructor() {
    this.validateEnvVariables();

    this.nodeEnv = process.env.BACKEND_NODE_ENV!;
    this.port = Number(process.env.BACKEND_PORT);
    this.host = process.env.BACKEND_HOST!;
    this.dbHost = process.env.DB_HOST!;
    this.dbPort = Number(process.env.DB_PORT);
    this.dbUser = process.env.DB_USER!;
    this.dbPassword = process.env.DB_PASSWORD!;
    this.dbName = process.env.DB_NAME!;
    this.jwtAccessSecret = process.env.JWT_ACCESS_SECRET!;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
    this.jwtAccessExpiration = process.env
      .JWT_ACCESS_EXPIRES_IN! as ms.StringValue;
    this.jwtRefreshExpiration = process.env
      .JWT_REFRESH_EXPIRES_IN! as ms.StringValue;
  }

  public static getInstance(): EnvConfig {
    if (!EnvConfig.instance) {
      EnvConfig.instance = new EnvConfig();
    }
    return EnvConfig.instance;
  }

  private validateEnvVariables(): void {
    const requiredEnvVariables = [
      "BACKEND_NODE_ENV",
      "BACKEND_PORT",
      "BACKEND_HOST",
      "DB_HOST",
      "DB_PORT",
      "DB_USER",
      "DB_PASSWORD",
      "DB_NAME",
      "JWT_ACCESS_SECRET",
      "JWT_REFRESH_SECRET",
      "JWT_ACCESS_EXPIRES_IN",
      "JWT_REFRESH_EXPIRES_IN",
    ];

    for (const envVar of requiredEnvVariables) {
      if (!process.env[envVar]) {
        throw new Error(`[CRITICAL] Missing environment variable: ${envVar}`);
      }
    }
  }
}
export const envConfig = EnvConfig.getInstance();
