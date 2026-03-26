import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import type { AuthService } from "./AuthService.js";
import { envConfig } from "../../infra/config/EnvConfig.js";
import { requireAuth } from "../../infra/web/middlewares/AuthMiddleware.js";
import type { AuthResponse } from "./IAuthResponse.js";
import { RegisterDTO } from "./dtos/RegisterDTO.js";
import { LoginDTO } from "./dtos/LoginDTO.js";
import type { ITokenService } from "./ITokenService.js";
import { UnauthenticatedError } from "../../infra/exceptions/UnauthenticatedError.js";
import { validateBody } from "../../infra/web/middlewares/ValidateDtoMiddleware.js";

export class AuthController {
  private authRouter: Router = Router();

  constructor(
    private authService: AuthService,
    private tokenService: ITokenService,
  ) {
    this.initializeRoutes();
  }

  public getRouter(): Router {
    return this.authRouter;
  }

  private initializeRoutes(): void {
    this.authRouter.post("/register", validateBody(RegisterDTO), this.register);
    this.authRouter.post("/login", validateBody(LoginDTO), this.login);
    this.authRouter.post(
      "/logout",
      requireAuth(this.tokenService),
      this.logout,
    );
    this.authRouter.post("/refresh", this.refresh);
    this.authRouter.get(
      "/me",
      requireAuth(this.tokenService),
      this.getCurrentUser,
    );
  }

  private register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    //on recupere le req.body qui contient les infos de l'utilisateur a enregistrer via le register DTO
    const registerDto: RegisterDTO = res.locals.validateBody;

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
    const loginDto: LoginDTO = res.locals.validateBody;

    //on appelle le service de connexion de l'utilisateur
    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );

    this.generateSecurityCookie(res, result);

    //on retourne une reponse avec un message de succes ou d'erreur
    return res
      .status(200)
      .json({ message: "User logged in successfully", user: result.user });

    //sinon, l'erreur est gerer par le middleware de gestion des erreurs et une reponse avec un message d'erreur est retournee
  };

  public logout = async (req: Request, res: Response) => {
    await this.authService.logout(req.user!.uuid);

    const cookieOptions = {
      httpOnly: true,
      secure: envConfig.nodeEnv === "production",
      sameSite: "strict" as const,
    };
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json({ message: "User logged out" });
  };

  public getCurrentUser = async (req: Request, res: Response) => {
    const user = await this.authService.getCurrentUser(req.user!.uuid);
    return res.status(200).json(user);
  };

  public refresh = async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new UnauthenticatedError();
    }

    const result = await this.authService.refresh(refreshToken);

    this.generateSecurityCookie(res, result);

    //on retourne une reponse avec un message de succes ou d'erreur
    return res
      .status(200)
      .json({ message: "Token refreshed successfully", user: result.user });
  };

  private generateSecurityCookie(res: Response, result: AuthResponse) {
    const csrfToken = this.tokenService.generateRandomToken();
    res.cookie("XSRF-TOKEN", csrfToken, {
      httpOnly: false,
      secure: envConfig.nodeEnv === "production",
      sameSite: "strict",
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: envConfig.nodeEnv === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, //7jours
    });
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: envConfig.nodeEnv === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });
  }
}
