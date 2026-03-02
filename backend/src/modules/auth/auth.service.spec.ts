import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "./auth.service.js";
import { User } from "../user/user.model.js";
import { HttpException } from "../../utils/HttpException.js";

describe("AuthService", () => {
  let authService: AuthService;
  let mockUserRepository: any;

  beforeEach(() => {
    // 1. On fabrique un faux UserRepository
    mockUserRepository = {
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };

    // 2. On instancie le service en lui injectant le faux repository
    authService = new AuthService(mockUserRepository);
  });

  describe("register()", () => {
    it("doit lever une erreur 400 si l'email existe déjà", async () => {
      // ÉTAPE 1 : Préparer le contexte (Arrange)
      const existingEmail = "test@test.com";
      const password = "password123";

      // On dit au faux repository : "Quand on t'appelle avec cet email, renvoie un faux User"
      mockUserRepository.findByEmail.mockResolvedValue(
        new User({
          email: existingEmail,
          password: "hashedpassword",
          cityId: 1,
        }),
      );

      // ÉTAPE 2 & 3 : Agir et Vérifier (Act & Assert)
      // À toi d'écrire la vérification avec Vitest !
      // Astuce : Cherche comment utiliser expect(...).rejects.toThrow() avec du code asynchrone.
      await expect(
        authService.register(existingEmail, password),
      ).rejects.toMatchObject(new HttpException(400, "Email already in use"));
    });
    it("doit inscrire l'utilisateur et renvoyer les tokens si l'email est disponible", async () => {
      // ÉTAPE 1 : Préparer le contexte (Arrange)
      const newEmail = "nouveau@test.com";
      const password = "password123";

      // On simule que l'email est libre en renvoyant null
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // ASTUCE : On injecte de fausses variables d'environnement juste pour ce test
      process.env.JWT_SECRET = "secret_de_test";
      process.env.JWT_EXPIRES_IN = "15m";
      process.env.JWT_REFRESH_SECRET = "secret_refresh_de_test";
      process.env.JWT_REFRESH_EXPIRES_IN = "7d";

      // ÉTAPE 2 : Agir (Act)
      // À TOI DE JOUER : Appelle authService.register et stocke le retour dans une constante 'result'

      // ÉTAPE 3 : Vérifier (Assert)
      // À TOI DE JOUER :
      // - Vérifie que result contient une propriété 'accessToken' avec expect(result).toHaveProperty(...)
      // - Vérifie que le repository a bien été appelé pour sauvegarder en BDD avec expect(mockUserRepository.create).toHaveBeenCalledOnce()
    });
  });
});
