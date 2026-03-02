import * as argon2 from "argon2";

export class HashUtil {
  static async hashString(str: string): Promise<string> {
    return await argon2.hash(str, {
      type: argon2.argon2id,
    });
  }

  static async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return await argon2.verify(hash, password);
  }
}
