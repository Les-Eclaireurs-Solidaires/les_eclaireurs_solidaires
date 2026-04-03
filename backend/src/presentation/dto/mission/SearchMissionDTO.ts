import { IsOptional, IsInt, IsString, IsDateString } from "class-validator";
import { Type } from "class-transformer";

export class SearchMissionDTO {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Le statut doit être un nombre entier." })
  status?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "L'ID de la ville doit être un nombre entier." })
  cityId?: number;

  @IsOptional()
  @IsDateString({},{ message: "La date de début n'est pas au bon format." })
  dateStart?: string;
}