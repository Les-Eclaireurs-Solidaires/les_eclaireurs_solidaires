import type { IUser } from "./user.interface.js";

export class User {
  private uuid: string;
  private refreshToken: string | null;
  private email: string;
  private password: string;
  private firstName: string | null;
  private lastName: string | null;
  private avatarUrl: string;
  private createdAt: Date;
  private updatedAt: Date | null;
  private deletedAt: Date | null;
  private cityId: number;
  private roleId: number;

  constructor(param: IUser) {
    this.createdAt = param.createdAt || new Date();
    this.uuid = param.uuid || crypto.randomUUID();

    this.refreshToken = param.refreshToken || null;
    this.email = param.email;
    this.password = param.password;
    this.firstName = param.firstName || null;
    this.lastName = param.lastName || null;
    this.avatarUrl = param.avatarUrl || "public/avatar/default.png";
    this.updatedAt = null;
    this.deletedAt = null;
    this.cityId = param.cityId;
    this.roleId = param.roleId;
  }
}
