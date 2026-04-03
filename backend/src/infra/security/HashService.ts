import * as argon2 from "argon2";
import type { IHashService } from "../../domain/auth/IHashService.js";

export class HashService implements IHashService {
  public constructor() {}

  async hashString(str: string): Promise<string> {
    return await argon2.hash(str, {
      type: argon2.argon2id,
    });
  }

  async compareStringToHash(password: string, hash: string): Promise<boolean> {
    return await argon2.verify(hash, password);
  }
}
