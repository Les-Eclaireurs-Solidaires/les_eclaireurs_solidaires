export interface IHashService{
  hashString(str: string): Promise<string>;
  compareStringToHash(password: string, hash: string): Promise<boolean>;
}