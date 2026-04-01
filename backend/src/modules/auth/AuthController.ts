import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import type { AuthService } from "./AuthService.js";
import { envConfig } from "../../infra/config/EnvConfig.js";
import type { AuthResponse } from "./IAuthResponse.js";
import { RegisterDTO } from "./dtos/RegisterDTO.js";
import type { ITokenService } from "./ITokenService.js";
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
