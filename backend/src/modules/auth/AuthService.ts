import type { IUserRepository } from "../user/IUserRepository.js";
import { User } from "../user/UserModel.js";
import type { AuthResponse } from "./IAuthResponse.js";
import type { IHashService } from "./IHashService.js";
import type { ITokenService } from "./ITokenService.js";

export class AuthService {
  constructor(
    private userRepository: IUserRepository,
    private hashService: IHashService,
    private tokenService: ITokenService,
  ) {}

  async register(email: string, password: string) {
    const user: User = new User({
      email,
      password,
    });

    const hashedPassword: string = await this.hashService.hashString(password);
    const accessToken: string = this.tokenService.generateAccessToken({
      uuid: user.getUuid(),
      roleId: user.getRoleId(),
    });
    const refreshToken: string = this.tokenService.generateRefreshToken({
      uuid: user.getUuid(),
      roleId: user.getRoleId(),
    });

    const hashedRefreshToken: string =
      await this.hashService.hashString(refreshToken);
    user.registerNewRefreshToken(hashedRefreshToken);
    user.changePassword(hashedPassword);

    await this.userRepository.create(user);

    const response: AuthResponse = {
      accessToken,
      refreshToken: refreshToken,
      user: user.toAuthResponse(),
    };

    return response;
  }
}
