import { Router, type NextFunction, type Request, type Response} from "express";
import type { AuthService } from "./auth.service.js";

export class AuthController {

    private authRouter: Router = Router();

    constructor(private authService: AuthService) {
        this.initializeRoutes();
    }

    public getRouter(): Router {
        return this.authRouter;
    }

    private initializeRoutes():void {
        this.authRouter.get('/register', this.register);
        this.authRouter.post('/login', this.login);
        this.authRouter.post('/logout', this.logout);
        this.authRouter.get('/me', this.getCurrentUser);
    }

    private register = async(req: Request, res: Response, next: NextFunction) => {

        //on recupere le req.body qui contient les infos de l'utilisateur a enregistrer via le login DTO
        //on appelle le service d'enregistrement de l'utilisateur
        //on retourne une reponse avec un message de succes ou d'erreur
        return res.status(201).json({ message: "User registered successfully" });
        
    }

    public async login (req: Request, res: Response, next: NextFunction) {
        
    }

    public async logout (req: Request, res: Response) { 
        
    }

    public async getCurrentUser (req: Request, res: Response)  {
        
    }
}