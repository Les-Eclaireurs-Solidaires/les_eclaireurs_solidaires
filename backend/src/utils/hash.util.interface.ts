export interface IHashUtil{
  hashString(str: string): Promise<string>;
  compareStringToHash(password: string, hash: string): Promise<boolean>;
}