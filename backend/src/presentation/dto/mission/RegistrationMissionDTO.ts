/* import { IsDateString, IsInt, IsUUID } from "class-validator";

export class RegistrationMissionDTO {
  @IsInt()
  id!: number;

  @IsUUID("4", { message: "L'UUID du bénévole est invalide." })
  volunteerUuid!: string;

  @IsDateString({}, { message: "La date d'inscription n'est pas au bon format." })
  date!: string;

  @IsInt()
  status!: number;
} */