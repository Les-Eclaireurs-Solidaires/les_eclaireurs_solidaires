import mysql, { PoolConnection, type Pool, type PoolOptions } from "mysql2/promise";
import { envConfig } from "../config/EnvConfig.js";

export class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    const targetDatabase =
      envConfig.nodeEnv === "test"
        ? `${envConfig.dbName}_test`
        : envConfig.dbName;

    const access: PoolOptions = {
      host: envConfig.dbHost,
      user: envConfig.dbUser,
      password: envConfig.dbPassword,
      database: targetDatabase,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };

    this.pool = mysql.createPool(access);
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async disconnect(): Promise<void> {
    await this.pool.end();
  }
  public getPool(): Pool {
    return this.pool;
  }
  public async getConnection(): Promise<PoolConnection> {
    return await this.pool.getConnection();
  }

}
