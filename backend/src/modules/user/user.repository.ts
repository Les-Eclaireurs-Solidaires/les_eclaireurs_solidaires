import type {
  Pool,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { User } from "./user.model.js";
import type { IUser } from "./user.interface.js";
import type { IUserRepository } from "./user.repository.interface.js";
import { HttpException } from "../../utils/HttpException.js";

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

  async findByEmail(email: string): Promise<User | null>{
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

  async create(user: User): Promise<User>{
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

    await this.db.execute(query, values);
    return user;
  }

  async update(uuid: string, payload: Partial<IUser>): Promise<boolean>{
    const values: (string | number | Date | null)[] = [];
    const setClauses = [];

    for (const key in payload) {
      const value = payload[key as keyof IUser];

      if (value !== undefined) {
        setClauses.push(`${this.columnMapping[key]} = ?`);
        values.push(value as string | number | Date | null);
      }
    }

    if (setClauses.length === 0) {
      throw new HttpException(400, "No fields to update");
    }

    const query = `UPDATE \`user\` SET ${setClauses.join(", ")} WHERE user_uuid = ?`;
    values.push(uuid);

    const [result] = await this.db.execute<ResultSetHeader>(query, values);
    return result.affectedRows > 0;
  }

  async delete(uuid: string): Promise<boolean>{
    const query = `UPDATE \`user\` SET user_deleted_at = NOW() WHERE user_uuid = ?`;
    const [result] = await this.db.execute<ResultSetHeader>(query, [uuid]);
    return result.affectedRows > 0;
  }
}
