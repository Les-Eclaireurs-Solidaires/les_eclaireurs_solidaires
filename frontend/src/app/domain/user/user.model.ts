import { InvalidUserRoleError } from '../../core/exceptions/invalid-user-role-error';

export enum UserRole {
  SUPER_ADMIN = 1,
  ORGANISATEUR = 2,
  BENEVOLE = 3,
}

export interface UserParam {
  uuid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  cityId?: number;
  roleId: number;
}
export class UserModel {
  private uuid: string;
  private email: string;
  private firstName: string | null;
  private lastName: string | null;
  private avatarUrl?: string;
  private createdAt?: Date | null;
  private updatedAt: Date | null;
  private deletedAt: Date | null;
  private cityId: number | null;
  private roleId: number;

  private constructor(data: UserParam) {
    this.uuid = data.uuid;
    this.email = data.email;
    this.firstName = data.firstName ?? null;
    this.lastName = data.lastName ?? null;
    this.avatarUrl = data.avatarUrl ?? 'public/avatar/default.png';
    this.createdAt = data.createdAt ?? null;
    this.updatedAt = data.updatedAt ?? null;
    this.deletedAt = data.deletedAt ?? null;
    this.cityId = data.cityId ?? null;
    this.roleId = data.roleId;
  }

  public static reconstitute(data: UserParam): UserModel {
    return new UserModel(data);
  }
  public toJSON(): UserParam {
    return {
      uuid: this.uuid,
      email: this.email,
      firstName: this.firstName ?? undefined,
      lastName: this.lastName ?? undefined,
      avatarUrl: this.avatarUrl,
      createdAt: this.createdAt ?? undefined,
      updatedAt: this.updatedAt ?? undefined,
      deletedAt: this.deletedAt ?? undefined,
      cityId: this.cityId ?? undefined,
      roleId: this.roleId,
    };
  }
  public getRole(): UserRole {
    switch (this.roleId) {
      case 1:
        return UserRole.SUPER_ADMIN;
      case 2:
        return UserRole.ORGANISATEUR;
      case 3:
        return UserRole.BENEVOLE;
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
}
