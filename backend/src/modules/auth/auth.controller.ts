import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import type { AuthService } from "./auth.service.js";
import { LoginDto } from "./dtos/login.dto.js";
import { RegisterDto } from "./dtos/register.dto.js";
import { validateDto } from "../../middleware/validateDto.middleware.js";

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
    this.authRouter.post("/logout", this.logout);
    this.authRouter.get("/me", this.getCurrentUser);
  }

  private register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    //on recupere le req.body qui contient les infos de l'utilisateur a enregistrer via le register DTO
    const registerDto: RegisterDto = req.body;

    //on appelle le service d'enregistrement de l'utilisateur
    const result: any = await this.authService.register(
      registerDto.email,
      registerDto.password,
    );

    //on retourne une reponse avec un message de succes ou d'erreur
    return res.status(200).json({ message: "User registered successfully", ...result });
  };

  public login = async (req: Request, res: Response, next: NextFunction) => {
    //on recupere le req.body qui contient les infos de l'utilisateur a connecter via le login DTO
    const loginDto: LoginDto = req.body;

    //on appelle le service de connexion de l'utilisateur
    const result: any = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );

    //si la connexion est reussie, on retourne une reponse avec un token d'authentification et les infos de l'utilisateur
    return res
      .status(200)
      .json({ message: "User logged in successfully", ...result });

    //sinon, l'erreur est gerer par le middleware de gestion des erreurs et une reponse avec un message d'erreur est retournee
  };

  public logout = (req: Request, res: Response) => {
    
  };

  public getCurrentUser = async (req: Request, res: Response) => {};
}
