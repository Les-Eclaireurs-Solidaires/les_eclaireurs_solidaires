import {
  Router,
  type NextFunction,
  type Request,
  type Response,
  type CookieOptions,
} from "express";
import type { AuthService } from "../application/AuthService.js";
import type { ITokenService } from "../domain/authentication/interfaces/ITokenService.js";
import { validateBody } from "../infra/web/middlewares/ValidateDtoMiddleware.js";
import { LoginDTO } from "./dto/auth/LoginDTO.js";
import { RegisterDTO } from "./dto/auth/RegisterDTO.js";
import { requireAuth } from "../infra/web/middlewares/AuthMiddleware.js";
import { envConfig } from "../infra/config/EnvConfig.js";
import { UnauthenticatedError } from "../infra/exceptions/UnauthenticatedError.js";
import type { AuthResponse } from "../domain/authentication/interfaces/AuthResponse.js";

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
    const registerDto: RegisterDTO = res.locals.validateBody;

    const result = await this.authService.register(
      registerDto.email,
      registerDto.password,
    );

    this.generateSecurityCookie(res, result);

    return res
      .status(201)
      .json({ message: "User registered successfully", user: result.user });
  };

  public login = async (req: Request, res: Response, next: NextFunction) => {
    const loginDto: LoginDTO = res.locals.validateBody;

    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );

    this.generateSecurityCookie(res, result);

    return res
      .status(200)
      .json({ message: "User logged in successfully", user: result.user });
  };

  public logout = async (req: Request, res: Response) => {
    await this.authService.logout(req.user!.uuid);

    const jwtCookieOptions: CookieOptions = {
      httpOnly: true,
      secure: envConfig.nodeEnv === "production",
      sameSite: "strict",
      path: "/",
    };

    const csrfCookieOptions: CookieOptions = {
      httpOnly: false,
      secure: envConfig.nodeEnv === "production",
      sameSite: "strict",
      path: "/",
    };

    res.clearCookie("accessToken", jwtCookieOptions);
    res.clearCookie("refreshToken", jwtCookieOptions);
    res.clearCookie("XSRF-TOKEN", csrfCookieOptions);

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

    return res
      .status(200)
      .json({ message: "Token refreshed successfully", user: result.user });
  };

  private generateSecurityCookie(res: Response, result: AuthResponse) {
    const csrfToken = this.tokenService.generateRandomToken();
    res.cookie("XSRF-TOKEN", csrfToken, {
      httpOnly: false,
      secure: envConfig.nodeEnv === "production",
      path: "/",
      sameSite: "strict",
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: envConfig.nodeEnv === "production",
      path: "/",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: envConfig.nodeEnv === "production",
      path: "/",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });
  }
}
