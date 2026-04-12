import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

export class CityController {
  private cityRouter: Router = Router();

  constructor() {
    this.initializeRoutes();
  }
  public getRouter(): Router {
    return this.cityRouter;
  }
  private initializeRoutes(): void {
    (this.cityRouter.get("/search", this.citySearch));
  }
  private citySearch = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    
    return res
  };
}
