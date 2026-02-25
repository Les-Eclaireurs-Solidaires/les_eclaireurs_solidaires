import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

export class AppConfig {
    private app: express.Application;
    private port: number; 
    private host: string;

    constructor() {
        this.app = express();
        this.port = Number(process.env.PORT);
        this.host = process.env.HOST!;
        this.initializeMiddlewares();
        this.initializeRoutes();
    }

    private initializeMiddlewares() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cors());
        this.app.use(helmet());
        this.app.use(cookieParser());
    }

    private initializeRoutes() {
        this.app.get("/", (req, res) => {
            res.send("Hello World!");
        });
        
    }
    public listen() {
        this.app.listen(this.port, this.host, () => {
                  console.log(`Server started on http://${this.host}:${this.port}`);
        });
    }
}