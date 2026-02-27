import type { UserRepository } from "../user/user.repository.js";

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
        
    }

    async logout(userId: string) {
        
    }

    async getCurrentUser(userId: string) {
        
    }
}