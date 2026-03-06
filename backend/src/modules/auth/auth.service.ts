import { HttpException } from "../../utils/HttpException.js";
import { TokenUtil } from "../../utils/token.util.js";
import type { IHashUtil } from "../../utils/hash.util.interface.js";
import { User } from "../user/user.model.js";
import type { AuthResponse } from "../../utils/AuthPayload.js";
import type { IUserRepository } from "../user/user.repository.interface.js";

export class AuthService {
  constructor(private userRepository: IUserRepository, private hashUtil: IHashUtil) {}

  async register(email: string, password: string) {
    //à ce niveau on est sûr des données grâce au DTO
    //on vérifie que l'email n'est pas déja utilisé
    const existingUser: User | null = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new HttpException(400, "Email was in use");
    }
    //si on a pas d'utilisateur correspondant au mail
    //on cree un nouvel utilisateur
    const user: User = new User({
      email,
      password,
    });

    //on hash le mot de passe
    const hashedPassword: string = await this.hashUtil.hashString(password);
    //on genere un token d'authentification et un refresh token
    const accessToken: string = TokenUtil.generateAccessToken({
      uuid: user.getUuid(),
      roleId: user.getRoleId(),
    });
    const refreshToken: string= TokenUtil.generateRefreshToken({
      uuid: user.getUuid(),
      roleId: user.getRoleId(),
    });

    const hashedRefreshToken: string= await this.hashUtil.hashString(refreshToken);
    user.setRefreshToken(hashedRefreshToken);
    user.setPassword(hashedPassword);

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
    const user: User | null= await this.userRepository.findByEmail(email);
    if (!user) {
      throw new HttpException(400, "Invalid email or password");
    }
    //on compare le mot de passe avec le mot de passe hash dans la base de donnees
    // getPassword() est une méthode de UserModel qui retourne le mot de passe hashé de l'utilisateur
    const isPasswordValid: boolean = await this.hashUtil.compareStringToHash(
      password,
      user.getPassword(),
    );
    if (!isPasswordValid) {
      throw new HttpException(400, "Invalid email or password");
    }
    //si la comparaison est reussie, on genere un token d'authentification et un refresh token
    const accessToken: string = TokenUtil.generateAccessToken({
      uuid: user.getUuid(),
      roleId: user.getRoleId(),
    });

    const refreshToken: string = TokenUtil.generateRefreshToken({
      uuid: user.getUuid(),
      roleId: user.getRoleId(),
    });

    const hashedRefreshToken : string = await this.hashUtil.hashString(refreshToken);

    //on met a jour le refresh token dans la base de donnees
    await this.userRepository.update(user.getUuid(), {
      refreshToken: hashedRefreshToken,
    });

    const response: AuthResponse = {
      accessToken,
      refreshToken: refreshToken,
      user: user.toAuthResponse(),
    };

    return response;
  }

  async logout(uuid: string) {
    await this.userRepository.update(uuid, { refreshToken: null });
  }

  async getCurrentUser(uuid: string) {
    const user = await this.userRepository.findByUuid(uuid);
    if (!user) {
      throw new HttpException(404, "Utilisateur introuvable");
    }
    // On nettoie les données sensibles avant de renvoyer au front !
    return user.toAuthResponse();
  }

  async refresh(refreshToken: string) {
    const payload = TokenUtil.verifyRefreshToken(refreshToken);

    const user = await this.userRepository.findByUuid(payload.uuid);
    if (!user) {
      throw new HttpException(401, "User not found");
    }

    const isRefreshTokenValid = await this.hashUtil.compareStringToHash(
      refreshToken,
      user.getRefreshToken()!,
    );

    if (!isRefreshTokenValid) {
      throw new HttpException(401, "Invalid refresh token");
    }

    const accessToken = TokenUtil.generateAccessToken({
      uuid: user.getUuid(),
      roleId: user.getRoleId(),
    });

    const newRefreshToken = TokenUtil.generateRefreshToken({
      uuid: user.getUuid(),
      roleId: user.getRoleId(),
    });

    const hashedRefreshToken = await this.hashUtil.hashString(newRefreshToken);

    await this.userRepository.update(user.getUuid(), {
      refreshToken: hashedRefreshToken,
    });

    const response: AuthResponse = {
      accessToken,
      refreshToken: newRefreshToken,
      user: user.toAuthResponse(),
    };

    return response;
  }
}
