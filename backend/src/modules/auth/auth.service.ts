import type { UserRepository } from "../user/user.repository.js";
import { HttpException } from "../../utils/HttpException.js";
import { HashUtil } from "../../utils/hash.util.js";
import { JwtUtil } from "../../utils/jwt.util.js";
import { User } from "../user/user.model.js";

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async register(email: string, password: string) {
    //on verifie que l'email n'est pas deja utilise
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new HttpException(400, "Email already in use");
    }

    const user = new User({
      email,
      password,
      cityId: 1,
    });

    //on hash le mot de passe
    const hashedPassword = await HashUtil.hashString(password);
    //on genere un token d'authentification et un refresh token
    const accessToken = JwtUtil.generateAccessToken({
      uuid: user.getUuid(),
      roleId: user.getRoleId(),
    });
    const refreshToken = JwtUtil.generateRefreshToken({
      uuid: user.getUuid(),
      roleId: user.getRoleId(),
    });

    const hashedRefreshToken = await HashUtil.hashString(refreshToken);
    user.setRefreshToken(hashedRefreshToken);
    user.setPassword(hashedPassword);

    //on enregistre l'utilisateur dans la base de donnees
    await this.userRepository.create(user);
    //on retourne une reponse avec un message de succes ou d'erreur
    return {
      accessToken,
      refreshToken,
      user: {
        uuid: user.getUuid(),
        email: user.getEmail(),
        roleId: user.getRoleId(),
      },
    };
  }

  async login(email: string, password: string) {
    //on verifie que l'email existe dans la base de donnees
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new HttpException(400, "Invalid email or password");
    }
    //on compare le mot de passe avec le mot de passe hash dans la base de donnees
    // getPassword() est une méthode de UserModel qui retourne le mot de passe hashé de l'utilisateur
    const isPasswordValid = await HashUtil.comparePassword(
      password,
      user.getPassword(),
    );
    if (!isPasswordValid) {
      throw new HttpException(400, "Invalid email or password");
    }
    //si la comparaison est reussie, on genere un token d'authentification et un refresh token
    const accessToken = JwtUtil.generateAccessToken({
      uuid: user.getUuid(),
      roleId: user.getRoleId(),
    });

    const refreshToken = JwtUtil.generateRefreshToken({
      uuid: user.getUuid(),
      roleId: user.getRoleId(),
    });

    const hashedRefreshToken = await HashUtil.hashString(refreshToken);

    //on met a jour le refresh token dans la base de donnees
    await this.userRepository.update(user.getUuid(), {
      refreshToken: hashedRefreshToken,
    });
    //on retourne une reponse avec un token d'authentification et les infos de l'utilisateur
    return {
      accessToken,
      refreshToken,
      user: {
        uuid: user.getUuid(),
        email: user.getEmail(),
        roleId: user.getRoleId(),
      },
    };

    //on passe la main au controller pour envoyer la reponse
  }

  async logout(uuid: string) {
    await this.userRepository.update(uuid, { refreshToken: null });
  }

  async getCurrentUser(userId: string) {}
}
