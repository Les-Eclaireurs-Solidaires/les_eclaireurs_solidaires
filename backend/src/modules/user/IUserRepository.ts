import { User } from "./UserModel.js";
import type { IUser } from "./IUserModel.js";

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findByUuid(uuid: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(user: User): Promise<boolean>;
  delete(uuid: string): Promise<boolean>;
}
