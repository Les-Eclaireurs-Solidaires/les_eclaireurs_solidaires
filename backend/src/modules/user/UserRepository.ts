import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { User } from "./UserModel.js";
import type { IUser } from "./IUserModel.js";
import type { IUserRepository } from "./IUserRepository.js";
import { EmptyUpdateError } from "../../infra/exceptions/EmptyUpdateError.js";
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

  async findByEmail(email: string): Promise<User | null> {
    const query: string = `SELECT  
                            u.user_uuid AS uuid,
                            u.user_email AS email,
                            u.user_password AS password,
                            u.user_refresh_token AS refreshToken,
                            u.user_firstname AS firstName,
                            u.user_lastname AS lastName,
                            u.user_avatar AS avatarUrl,
                            u.user_created_at AS createdAt,
                            u.user_updated_at AS updatedAt,
                            u.user_deleted_at AS deletedAt,
                            u.id_city AS cityId,
                            u.id_role AS roleId
                            FROM \`user\` AS u
                            WHERE user_email = ?`;
    const [rows] = await this.db.execute<RowDataPacket[]>(query, [email]);
    if (rows.length === 0) return null;
    return new User(rows[0] as IUser);
  }

  async findByUuid(uuid: string): Promise<User | null> {
    const query = `SELECT 
                      u.user_uuid AS uuid,
                      u.user_email AS email,
                      u.user_password AS password,
                      u.user_refresh_token AS refreshToken,
                      u.user_firstname AS firstName,
                      u.user_lastname AS lastName,
                      u.user_avatar AS avatarUrl,
                      u.user_created_at AS createdAt,
                      u.user_updated_at AS updatedAt,
                      u.user_deleted_at AS deletedAt,
                      u.id_city AS cityId,
                      u.id_role AS roleId
                    FROM \`user\` AS u
                    WHERE user_uuid = ?`;

    const [rows] = await this.db.execute<RowDataPacket[]>(query, [uuid]);

    return rows.length === 0 ? null : new User(rows[0] as IUser);
  }

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
      user.getFirstName(), // firstName
      user.getLastName(), // lastName
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

  async update(user: User): Promise<boolean> {
    const query = `UPDATE \`user\` 
                    SET 
                      user_email = ?, 
                      user_password = ?, 
                      user_refresh_token = ?, 
                      user_firstname = ?, 
                      user_lastname = ?, 
                      user_avatar = ?, 
                      user_updated_at = ?, 
                      id_city = ?, 
                      id_role = ? 
                    WHERE user_uuid = ?`;
    const values = [
      user.getEmail(),
      user.getPassword(),
      user.getRefreshToken(),
      user.getFirstName(),
      user.getLastName(),
      user.getAvatarUrl(),
      user.getUpdatedAt(),
      user.getCityId(),
      user.getRoleId(),
      user.getUuid(),
    ];

    const [result] = await this.db.execute<ResultSetHeader>(query, values);
    return result.affectedRows > 0;
  }

  async delete(uuid: string): Promise<boolean> {
    const query = `UPDATE \`user\` SET user_deleted_at = NOW() WHERE user_uuid = ?`;
    const [result] = await this.db.execute<ResultSetHeader>(query, [uuid]);
    return result.affectedRows > 0;
  }
}
