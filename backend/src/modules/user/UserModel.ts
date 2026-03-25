import type { IUser } from "./IUserModel.js";

export class User {
  private uuid: string;
  private refreshToken: string | null;
  private email: string;
  private password: string;
  private firstName: string | null;
  private lastName: string | null;
  private avatarUrl?: string;
  private createdAt?: Date;
  private updatedAt: Date | null;
  private deletedAt: Date | null;
  private cityId: number | null;
  private roleId: number;

  constructor(param: IUser) {
    this.createdAt = param.createdAt || new Date();
    this.uuid = param.uuid || crypto.randomUUID();
    this.avatarUrl = param.avatarUrl || "public/avatar/default.png";
    this.roleId = param.roleId || 3;

    this.email = param.email;
    this.password = param.password;
    this.refreshToken = param.refreshToken || null;
    this.firstName = param.firstName || null;
    this.lastName = param.lastName || null;
    this.updatedAt = null;
    this.deletedAt = null;
    this.cityId = param.cityId || null;
  }

  toAuthResponse() {
    return {
      uuid: this.uuid,
      email: this.email,
      roleId: this.roleId,
    };
  }

  public changePassword(newHashedPassword: string): void {
    this.password = newHashedPassword;
    this.updatedAt = new Date();
    }

  public registerNewRefreshToken(newRefreshToken: string | null): void {
    this.refreshToken = newRefreshToken;
  }

  public changeEmail(newEmail: string): void {
    this.email = newEmail;
    this.updatedAt = new Date();
  }

  getUuid(): string {
    return this.uuid;
  }

  getPassword(): string {
    return this.password;
  }

  getFirstName(): string | null {
    return this.firstName;
  }

  getLastName(): string | null {
    return this.lastName;
  }

  getAvatarUrl(): string {
    return this.avatarUrl || "public/avatar/default.png";
  }

  getCreatedAt(): Date {
    return this.createdAt!;
  }

  getUpdatedAt(): Date | null {
    return this.updatedAt;
  }

  getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  getCityId(): number | null {
    return this.cityId;
  }

  getEmail(): string {
    return this.email;
  }

  getRoleId(): number {
    return this.roleId!;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }
}
