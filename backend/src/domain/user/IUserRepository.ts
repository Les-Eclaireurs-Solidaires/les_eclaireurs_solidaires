import type { PoolConnection } from "mysql2/promise";
import { User } from "./User.js";

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findByUuid(uuid: string, connection?: PoolConnection): Promise<User | null>;
  create(user: User): Promise<User>;
  update(user: User): Promise<boolean>;
}
