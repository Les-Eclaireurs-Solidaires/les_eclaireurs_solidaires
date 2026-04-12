import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsEnum, IsOptional } from "class-validator";
import { MissionStatus } from "../../../domain/mission/MissionStatusEnum.js";

export class FiltersInputDTO {
  @IsOptional()
  @IsArray({ message: "Le statut doit être une liste." })
  @ArrayNotEmpty({
    message: "Vous devez fournir au moins un statut pour la recherche.",
  })
  @IsEnum(MissionStatus, {
    each: true,
    message: "Un ou plusieurs statuts sont invalides.",
  })
  @Type(() => Number)
  status!: MissionStatus[];

  onlyMissions?: boolean;

  cityId?: number;
  categoryIds?: number[];
  name?: string;
  dateStart?: Date;
  address?: string;
}
