import type { UserRepository } from "../user/user.repository.js";
import { HttpException } from "../../utils/HttpException.js";

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async register(email: string, password: string) {
    //on verifie que l'email n'est pas deja utilise
    //on hash le mot de passe
    //on genere un token d'authentification et un refresh token
    //on enregistre l'utilisateur dans la base de donnees
    //on retourne une reponse avec un message de succes ou d'erreur
  }

  async login(email: string, password: string) {
    //on verifie que l'email existe dans la base de donnees
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new HttpException(401, "Invalid email or password");
    }
    //on compare le mot de passe avec le mot de passe hash dans la base de donnees
    // getPassword() est une méthode de UserModel qui retourne le mot de passe hashé de l'utilisateur
    const isPasswordValid = await this.comparePassword(
      password,
      user.getPassword(),
    );
    if (!isPasswordValid) {
      throw new HttpException(401, "Invalid email or password");
    }
    //si la comparaison est reussie, on genere un token d'authentification et un refresh token
    // FAIRE UNE METHODE UTILITAIRE
    //on met a jour le refresh token dans la base de donnees
    //on retourne une reponse avec un token d'authentification et les infos de l'utilisateur
    //sinon, on retourne une reponse avec un message d'erreur
  }

  async logout(userId: string) {}

  async getCurrentUser(userId: string) {}
}
