import { IsEmail, MinLength } from "class-validator";

export class RegisterDTO {
  @IsEmail()
  email!: string;
  @MinLength(6)
  password!: string;
}