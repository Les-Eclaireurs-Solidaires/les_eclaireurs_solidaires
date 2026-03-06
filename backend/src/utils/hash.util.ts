import * as argon2 from "argon2";
import type { IHashUtil } from "./hash.util.interface.js";

export class HashUtil implements IHashUtil {

  public constructor() {}

  async hashString(str: string): Promise<string> {
    return await argon2.hash(str, {
      type: argon2.argon2id,
    });
  }

  async compareStringToHash(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return await argon2.verify(hash, password);
  }
}
