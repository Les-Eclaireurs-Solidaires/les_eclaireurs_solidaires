import { User } from "./UserModel.js";

export interface IUserRepository {
  create(user: User): Promise<User>;
}
