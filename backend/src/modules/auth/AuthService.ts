import type { IUserRepository } from "../user/IUserRepository.js";
import { UserNotFoundError } from "../../domain/exceptions/auth/UserNotFoundError.js";
import { InvalidCredentialsError } from "../../domain/exceptions/auth/InvalidCredentialsError.js";
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

  async login(email: string, password: string) {
    const user: User | null = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }
    const isPasswordValid: boolean = await this.hashService.compareStringToHash(
      password,
      user.getPassword(),
    );
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }
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

    
    const isUpdated = await this.userRepository.update(user);
    if(!isUpdated) throw new UserNotFoundError();

    const response: AuthResponse = {
      accessToken,
      refreshToken: refreshToken,
      user: user.toAuthResponse(),
    };

    return response;
  }

  async logout(uuid: string) {
    const user: User | null = await this.userRepository.findByUuid(uuid);
    if (!user) {
      throw new UserNotFoundError();
    }
    user.registerNewRefreshToken(null);
    await this.userRepository.update(user);
  }

}
