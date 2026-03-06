import { User } from "../user/user.model.js";
import type { IUser } from "../user/user.interface.js";

export interface  IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findByUuid(uuid: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(uuid: string, payload: Partial<IUser>): Promise<boolean>;
  delete(uuid: string): Promise<boolean>;
}