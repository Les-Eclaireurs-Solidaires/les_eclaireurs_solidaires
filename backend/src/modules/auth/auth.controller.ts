import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import type { AuthService } from "./auth.service.js";
import { LoginDto } from "../../dtos/login.dto.js";
import { RegisterDto } from "../../dtos/register.dto.js";
import { validateDto } from "../../middleware/validateDto.middleware.js";
import { HttpException } from "../../utils/AppException.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { TokenUtil } from "../../utils/token.util.js";
import type { AuthResponse } from "../../utils/AuthPayload.js";

export class AuthController {
  private authRouter: Router = Router();

  constructor(private authService: AuthService) {
    this.initializeRoutes();
  }

  public getRouter(): Router {
    return this.authRouter;
  }

  private initializeRoutes(): void {
    this.authRouter.post("/register", validateDto(RegisterDto), this.register);
    this.authRouter.post("/login", validateDto(LoginDto), this.login);
    this.authRouter.post("/logout", requireAuth, this.logout);
    this.authRouter.post("/refresh", this.refresh);
    this.authRouter.get("/me", requireAuth, this.getCurrentUser);
  }

  private register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    //on recupere le req.body qui contient les infos de l'utilisateur a enregistrer via le register DTO
    const registerDto: RegisterDto = req.body;

    //on appelle le service d'enregistrement de l'utilisateur
    const result = await this.authService.register(
      registerDto.email,
      registerDto.password,
    );

    this.generateSecurityCookie(res, result);

    //on retourne une reponse avec un message de succes ou d'erreur
    return res
      .status(201)
      .json({ message: "User registered successfully", user: result.user });
  };

  public login = async (req: Request, res: Response, next: NextFunction) => {
    //on recupere le req.body qui contient les infos de l'utilisateur a connecter via le login DTO
    const loginDto: LoginDto = req.body;

    //on appelle le service de connexion de l'utilisateur
    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );

    this.generateSecurityCookie(res, result);

    //on retourne une reponse avec un message de succes ou d'erreur
    return res
      .status(201)
      .json({ message: "User logged in successfully", user: result.user });

    //sinon, l'erreur est gerer par le middleware de gestion des erreurs et une reponse avec un message d'erreur est retournee
  };

  public logout = async (req: Request, res: Response) => {
    if (!req.user) {
      throw new HttpException(401, "Token unknown");
    }

    await this.authService.logout(req.user.uuid);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
    };
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json({ message: "User logged out" });
  };

  public getCurrentUser = async (req: Request, res: Response) => {
    if (!req.user) {
      throw new HttpException(401, "Non autorisé");
    }
    const user = await this.authService.getCurrentUser(req.user.uuid);
    return res.status(200).json(user);
  };

  public refresh = async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new HttpException(401, "Refresh token manquant");
    }

    const result = await this.authService.refresh(refreshToken);

    this.generateSecurityCookie(res, result);

    //on retourne une reponse avec un message de succes ou d'erreur
    return res
      .status(200)
      .json({ message: "Token refreshed successfully", user: result.user });
  };

  private generateSecurityCookie(res: Response, result: AuthResponse) {
    const csrfToken = TokenUtil.generateRandomToken();
    res.cookie("XSRF-TOKEN", csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, //7jours
    });
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });
  }
}
