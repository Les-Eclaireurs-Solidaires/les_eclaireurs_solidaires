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