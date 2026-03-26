import { IsOptional, IsInt, IsString, IsDate } from "class-validator";
import { Type } from "class-transformer";

export class SearchMissionDTO {
  @IsOptional()
  @Type(() => Number) // Convertit le string de l'URL en Number
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
  @Type(() => Date) // Convertit le string "2026-05-01" en objet Date
  @IsDate({ message: "La date de début n'est pas au bon format." })
  dateStart?: Date;
}