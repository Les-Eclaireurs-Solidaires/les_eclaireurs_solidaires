import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { User } from "./UserModel.js";
import type { IUserRepository } from "./IUserRepository.js";
import { EmailAlreadyExistError } from "../../domain/exceptions/auth/EmailAlreadyExistError.js";

export class UserRepository implements IUserRepository {
  private readonly columnMapping: { [key: string]: string } = {
    uuid: "user_uuid",
    email: "user_email",
    password: "user_password",
    refreshToken: "user_refresh_token",
    firstName: "user_firstname",
    lastName: "user_lastname",
    avatarUrl: "user_avatar",
    createdAt: "user_created_at",
    updatedAt: "user_updated_at",
    deletedAt: "user_deleted_at",
    cityId: "id_city",
    roleId: "id_role",
  };

  constructor(private db: Pool) {}

  

  async create(user: User): Promise<User> {
    const query = `INSERT INTO \`user\` (
      user_uuid,
      user_email,
      user_password,
      user_refresh_token,
      user_firstname,
      user_lastname,
      user_avatar,
      user_created_at,
      id_city,
      id_role
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      user.getUuid(),
      user.getEmail(),
      user.getPassword(),
      user.getRefreshToken(),
      user.getFirstName(),
      user.getLastName(), 
      user.getAvatarUrl(),
      user.getCreatedAt(),
      user.getCityId(),
      user.getRoleId(),
    ];

    try {
      await this.db.execute<ResultSetHeader>(query, values);
      return user;
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new EmailAlreadyExistError(user.getEmail());
      }
      throw error;
    }
  }
}
