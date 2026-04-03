import type { AuthResponse } from "../domain/authentication/AuthResponse.js";
import { InvalidCredentialsError } from "../domain/authentication/exceptions/InvalidCredentialsError.js";
import { InvalidTokenError } from "../domain/authentication/exceptions/InvalidTokenError.js";
import type { IHashService } from "../domain/authentication/IHashService.js";
import type { ITokenService } from "../domain/authentication/ITokenService.js";
import { UserNotFoundError } from "../domain/user/exceptions/UserNotFoundError.js";
import type { IUserRepository } from "../domain/user/IUserRepository.js";
import { User } from "../domain/user/User.js";

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
    if (!isUpdated) throw new UserNotFoundError();

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

  async getCurrentUser(uuid: string) {
    const user = await this.userRepository.findByUuid(uuid);
    if (!user) {
      throw new UserNotFoundError();
    }
    return user.toAuthResponse();
  }

  async refresh(refreshToken: string) {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);

    const user = await this.userRepository.findByUuid(payload.uuid);
    if (!user) {
      throw new UserNotFoundError();
    }

    if (user.getRefreshToken() === null) {
      throw new InvalidTokenError();
    }

    const accessToken = this.tokenService.generateAccessToken({
      uuid: user.getUuid(),
      roleId: user.getRoleId(),
    });

    const newRefreshToken = this.tokenService.generateRefreshToken({
      uuid: user.getUuid(),
      roleId: user.getRoleId(),
    });

    const hashedRefreshToken =
      await this.hashService.hashString(newRefreshToken);
    user.registerNewRefreshToken(hashedRefreshToken);

    const isUpdated = await this.userRepository.update(user);
    if (!isUpdated) throw new UserNotFoundError();

    const response: AuthResponse = {
      accessToken,
      refreshToken: newRefreshToken,
      user: user.toAuthResponse(),
    };

    return response;
  }
}
