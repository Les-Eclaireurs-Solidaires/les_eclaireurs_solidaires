import "dotenv/config";
import mysql, { type Pool, type PoolOptions } from 'mysql2/promise';

export class Database {
    private static instance: Database;
    private connection: Pool;

    private constructor() {
        console.log("Initialisation de la connexion MySQL...");

        const access: PoolOptions = 
        {
            host: process.env.DB_HOST as string,
            user: process.env.DB_USER as string,
            password: process.env.DB_PASSWORD as string,
            database: process.env.DB_NAME as string,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        };

        this.connection = mysql.createPool(access);
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    public getConnection(): Pool {
        return this.connection;
    }
}