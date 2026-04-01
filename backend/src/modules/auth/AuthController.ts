import {
  Router,
  type NextFunction,
  type Request,
  type Response,
  type CookieOptions,
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

    const jwtCookieOptions: CookieOptions= {
      httpOnly: true,
      secure: envConfig.nodeEnv === "production",
      sameSite: "strict",
      path: "/",
    };

    const csrfCookieOptions: CookieOptions= {
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
