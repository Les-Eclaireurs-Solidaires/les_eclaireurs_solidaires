import type { Pool, RowDataPacket } from "mysql2/promise";

export class UserRepository {
  constructor(private db: Pool) {}

  async findByEmail(email: string) {
    const query: string = "SELECT * FROM user WHERE user_mail = ?";
    const [rows] = await this.db.execute<RowDataPacket[]>(query, [email]);
    return rows;
    
  }

  async findById(id: string) {
    
  }

  async create(user: { email: string; password: string }) {
    
  }
}
