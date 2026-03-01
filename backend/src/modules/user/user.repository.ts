import type { Pool, RowDataPacket } from "mysql2/promise";
import { User } from "./user.model.js";
import type { IUser } from "./user.interface.js";

export class UserRepository {
  constructor(private db: Pool) {}

  async findByEmail(email: string) {
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

  async findByUuid(uuid: string) {}

  async create(user: User) {}

  async update(user: User) {}

  async delete(id: string) {}
}
