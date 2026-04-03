export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    uuid: string;
    email: string;
    roleId: number;
  }
}

