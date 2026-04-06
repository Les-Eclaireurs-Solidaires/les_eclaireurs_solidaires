import dotenv from "dotenv";
import path from "path";
import "reflect-metadata";


dotenv.config({
  path: path.resolve(process.cwd(), ".env.test"),
})