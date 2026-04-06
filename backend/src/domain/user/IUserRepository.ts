import type { PoolConnection } from "mysql2/promise";
import type { User } from "./User.js";

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findByUuid(uuid: string, connection?: PoolConnection, lock?: boolean): Promise<User | null>;
  create(user: User): Promise<User>;
  update(user: User): Promise<boolean>;
}
