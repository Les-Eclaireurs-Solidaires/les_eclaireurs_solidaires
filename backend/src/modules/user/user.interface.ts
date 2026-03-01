export interface IUser {
  uuid?: string;
  email: string;
  password: string;
  refreshToken?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl: string | "public/avatar/default.png";
  createdAt: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
  cityId: number;
  roleId: number;
}
