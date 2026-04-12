import { InvalidUserRoleError } from "../../../core/exceptions/invalid-user-role-error";
import { UserParam } from "../interface/UserParam";
import { UserRole } from "../interface/UserRoleEnum";

export class UserModel {
  private uuid: string;
  private email: string;
  private firstName: string | null;
  private lastName: string | null;
  private avatarUrl?: string;
  private createdAt: Date;
  private updatedAt: Date | null;
  private deletedAt: Date | null;
  private cityId: number | null;
  private roleId: number;

  private constructor(data: UserParam) {
    this.uuid = data.uuid;
    this.email = data.email;
    this.firstName = data.firstName || null;
    this.lastName = data.lastName || null;
    this.avatarUrl = data.avatarUrl || 'public/avatar/default.png';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || null;
    this.deletedAt = data.deletedAt || null;
    this.cityId = data.cityId || null;
    this.roleId = data.roleId;
  }

  public static reconstitute(data: UserParam | null): UserModel | null{
    if(!data || !data.uuid)
    {
      return null;
    }
    return new UserModel(data);
  }
  public toJSON(): UserParam {
    return {
      uuid: this.uuid,
      email: this.email,
      firstName: this.firstName || undefined,
      lastName: this.lastName || undefined,
      avatarUrl: this.avatarUrl,
      createdAt: this.createdAt || undefined,
      updatedAt: this.updatedAt || undefined,
      deletedAt: this.deletedAt || undefined,
      cityId: this.cityId || undefined,
      roleId: this.roleId,
    };
  }
  public getRole(): UserRole {
    switch (this.roleId) {
      case 1:
        return UserRole.SUPER_ADMIN;
      case 2:
        return UserRole.ORGANIZER;
      case 3:
        return UserRole.VOLUNTEER;
      default:
        throw new InvalidUserRoleError("Le role n'est pas valide.");
    }
  }
  public getUuid(): string {
    return this.uuid;
  }
  public getEmail(): string {
    return this.email;
  }
  public getFirstName(): string | null {
    return this.firstName;
  }
  public getLastName(): string | null {
    return this.lastName;
  }
  public getAvatarUrl(): string | undefined {
    return this.avatarUrl;
  }
  public getCreatedAt(): Date {
    return this.createdAt;
  }
  public getUpdatedAt(): Date | null {
    return this.updatedAt;
  }
  public getDeletedAt(): Date | null {
    return this.deletedAt;
  }
  public getCityId(): number | null {
    return this.cityId;
  }
  public getRoleId(): number {
    return this.roleId;
  }
}
