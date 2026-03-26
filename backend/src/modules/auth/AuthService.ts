import type { IUserRepository } from "../user/IUserRepository.js";
import { EmailAlreadyExistError } from "../../domain/exceptions/auth/EmailAlreadyExistError.js";
import { UserNotFoundError } from "../../domain/exceptions/auth/UserNotFoundError.js";
import { InvalidCredentialsError } from "../../domain/exceptions/auth/InvalidCredentialsError.js";
import { User } from "../user/UserModel.js";
import type { AuthResponse } from "./IAuthResponse.js";
import type { IHashService } from "./IHashService.js";
import type { ITokenService } from "./ITokenService.js";
import { UnauthenticatedError } from "../../infra/exceptions/UnauthenticatedError.js";
import { InvalidTokenError } from "../../domain/exceptions/auth/InvalidTokenError.js";

export class AuthService {
  constructor(
    private userRepository: IUserRepository,
    private hashService: IHashService,
    private tokenService: ITokenService,
  ) {}

  async register(email: string, password: string) {
    // à ce niveau on est sûr des données grâce au DTO
    // on ne vérifie plus si l'email existe, on essaie de créer directement
    //on cree un nouvel utilisateur
    const user: User = new User({
      email,
      password,
    });

    //on hash le mot de passe
    const hashedPassword: string = await this.hashService.hashString(password);
    //on genere un token d'authentification et un refresh token
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

    //on enregistre l'utilisateur dans la base de donnees
    await this.userRepository.create(user);
    //on retourne une reponse avec un message de succes ou d'erreur
    const response: AuthResponse = {
      accessToken,
      refreshToken: refreshToken,
      user: user.toAuthResponse(),
    };

    return response;
  }

  async login(email: string, password: string) {
    //on verifie que l'email existe dans la base de donnees
    const user: User | null = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }
    //on compare le mot de passe avec le mot de passe hash dans la base de donnees
    // getPassword() est une méthode de UserModel qui retourne le mot de passe hashé de l'utilisateur
    const isPasswordValid: boolean = await this.hashService.compareStringToHash(
      password,
      user.getPassword(),
    );
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }
    //si la comparaison est reussie, on genere un token d'authentification et un refresh token
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

    //on met a jour le refresh token dans la base de donnees
    await this.userRepository.update(user);

    const response: AuthResponse = {
      accessToken,
      refreshToken: refreshToken,
      user: user.toAuthResponse(),
    };

    return response;
  }

  async logout(user: User) {
    user.registerNewRefreshToken(null);
    await this.userRepository.update(user);
  }

  async getCurrentUser(uuid: string) {
    const user = await this.userRepository.findByUuid(uuid);
    if (!user) {
      throw new UserNotFoundError();
    }
    // On nettoie les données sensibles avant de renvoyer au front !
    return user.toAuthResponse();
  }

  async refresh(refreshToken: string) {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);

    const user = await this.userRepository.findByUuid(payload.uuid);
    if (!user) {
      throw new UserNotFoundError();
    }

    const isRefreshTokenValid = await this.hashService.compareStringToHash(
      refreshToken,
      user.getRefreshToken()!,
    );

    if (!isRefreshTokenValid) {
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

    await this.userRepository.update(user);

    const response: AuthResponse = {
      accessToken,
      refreshToken: newRefreshToken,
      user: user.toAuthResponse(),
    };

    return response;
  }
}
