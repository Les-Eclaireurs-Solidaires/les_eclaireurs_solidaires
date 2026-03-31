import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "./AuthService.js";
import { User } from "../user/UserModel.js";
import type { IUserRepository } from "../user/IUserRepository.js";
import { InvalidCredentialsError } from "../../domain/exceptions/auth/InvalidCredentialsError.js";
import { EmailAlreadyExistError } from "../../domain/exceptions/auth/EmailAlreadyExistError.js";
import type { IHashService } from "./IHashService.js";
import type { ITokenService } from "./ITokenService.js";

describe("AuthService", () => {
  let authService: AuthService;
  let mockUserRepository: IUserRepository;
  let mockHashService: IHashService;
  let mockTokenService: ITokenService;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: vi.fn(),
      findByUuid: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockHashService = {
      hashString: vi.fn(),
      compareStringToHash: vi.fn(),
    };

    mockTokenService = {
      generateAccessToken: vi.fn().mockReturnValue("accessToken"),
      generateRefreshToken: vi.fn().mockReturnValue("accessToken"),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
      generateRandomToken: vi.fn(),
    };

    // 2. On instancie le service en lui injectant le faux repository
    authService = new AuthService(
      mockUserRepository,
      mockHashService,
      mockTokenService,
    );
  });

  describe("register()", () => {
    it("doit lever une erreur 400 si l'email existe déjà", async () => {
      const existingEmail = "test@test.com";
      const password = "password123";

      vi.mocked(mockUserRepository.create).mockRejectedValue(
        new EmailAlreadyExistError(existingEmail),
      );

      vi.mocked(mockHashService.hashString).mockResolvedValue("hashedPassword");

      await expect(
        authService.register(existingEmail, password),
      ).rejects.toMatchObject(new EmailAlreadyExistError(existingEmail));
    });
    it("doit inscrire l'utilisateur et renvoyer les tokens si l'email est disponible", async () => {
      const newEmail = "nouveau@test.com";
      const password = "password123";

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockHashService.hashString).mockResolvedValue("hashedPassword");

      const result = await authService.register(newEmail, password);

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result).toMatchObject({
        user: {
          uuid: expect.any(String),
          email: newEmail,
          roleId: 3,
        },
      });

      expect(mockUserRepository.create).toHaveBeenCalledOnce();
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: newEmail,
          password: expect.any(String),
          refreshToken: expect.any(String),
          firstName: null,
          lastName: null,
          avatarUrl: "public/avatar/default.png",
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          deletedAt: null,
          cityId: null,
          roleId: 3,
        }),
      );
    });
  });

  describe("login()", () => {
    it("doit lever une erreur 400 si l'email n'existe pas", async () => {
      const email = "test@test.com";
      const password = "password123";

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      await expect(authService.login(email, password)).rejects.toMatchObject(
        new InvalidCredentialsError(),
      );
    });
    it("doit lever une erreur 400 si le mot de passe est incorrect", async () => {
      const email = "test2@test.com";
      const password = "password123";

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(
        new User({
          uuid: "123e4567-e89b-12d3-a456-426614 174000",
          email: "test2@test.com",
          password: "password123",
          refreshToken: null,
          firstName: "test",
          lastName: null,
          avatarUrl: "public/avatardefault.png",
          createdAt: new Date(),
          updatedAt: null,
          deletedAt: null,
          cityId: 1,
          roleId: 3,
        }),
      );

      vi.mocked(mockHashService.compareStringToHash).mockResolvedValue(false);

      await expect(authService.login(email, password)).rejects.toMatchObject(
        new InvalidCredentialsError(),
      );
    });
    it("doit connecter l'utilisateur et renvoyer les tokens si l'email et le mot de passe sont valides", async () => {
      const email = "test@test.com";
      const password = "password123";
      const user = new User({
        uuid: "123e4567-e89b-12d3-a456-426614174000",
        email: "test@test.com",
        password: "password123",
        refreshToken: null,
        firstName: null,
        lastName: null,
        avatarUrl: "public/avatar/default.png",
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
        cityId: null,
        roleId: 3,
      });

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);
      vi.mocked(mockHashService.compareStringToHash).mockResolvedValue(true);
      vi.mocked(mockHashService.hashString).mockResolvedValue("hashedPassword");
      vi.mocked(mockUserRepository.update).mockResolvedValue(true);

      const result = await authService.login(email, password);

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result).toMatchObject({
        user: {
          uuid: user.getUuid(),
          email: email,
          roleId: 3,
        },
      });

      expect(mockHashService.hashString).toHaveBeenCalledOnce();
      expect(mockHashService.hashString).toHaveBeenCalledWith(
        expect.any(String),
      );

      expect(mockUserRepository.update).toHaveBeenCalledOnce();
      expect(mockUserRepository.update).toHaveBeenCalledWith(expect.any(User));
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledOnce();
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({
          uuid: user.getUuid(),
          roleId: user.getRoleId(),
        }),
      );
    });
  });
});
