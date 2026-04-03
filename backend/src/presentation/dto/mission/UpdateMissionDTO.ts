import { Transform, Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { OrganizerParticipationDTO } from "./OrganizerParticipationDTO.js";
import { IsAfterDate, IsFutureDate } from "../DateValidator.js";

export class UpdateMissionDTO {
  @IsOptional()
  @IsBoolean()
  toPublish?: boolean;

  @ValidateIf((o) => o.toPublish === true || o.name !== undefined)
  @IsOptional()
  @IsString()
  @MinLength(3, { message: "Le nom doit contenir au moins 3 caractères" })
  @MaxLength(255, { message: "Le nom ne doit pas dépasser 255 caractères" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  name?: string;

  @ValidateIf((o) => o.toPublish === true || o.description !== undefined)
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: "La description est trop longue." })
  description?: string;

  @ValidateIf((o) => o.toPublish === true || o.dateStart !== undefined)
  @IsOptional()
  @IsDateString({}, { message: "La date de début n'est pas au bon format." })
  @IsFutureDate({ message: "La date doit être dans le futur." })
  dateStart?: string;

  @ValidateIf((o) => o.toPublish === true || o.dateEnd !== undefined)
  @IsOptional()
  @IsDateString({}, { message: "La date de fin n'est pas au bon format." })
  @IsAfterDate("dateStart", {
    message: "La date de fin doit être après le début.",
  })
  dateEnd?: string;

  @ValidateIf((o) => o.toPublish === true || o.address !== undefined)
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: "L'adresse ne doit pas dépasser 255 caractères." })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  address?: string;

  @ValidateIf((o) => o.toPublish === true || o.nbrVolunteerNeeded !== undefined)
  @IsOptional()
  @IsInt()
  @Min(1)
  nbrVolunteerNeeded?: number;

  @ValidateIf((o) => o.toPublish === true || o.cityId !== undefined)
  @IsOptional()
  @IsInt()
  cityId?: number;

  @ValidateIf((o) => o.toPublish === true || o.categoryIds !== undefined)
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  categoryIds?: number[];

  @ValidateIf((o) => o.toPublish === true || o.organizers !== undefined)
  @IsOptional()
  @ArrayNotEmpty({
    message: "Une mission doit avoir au moins un organisateur.",
  })
  @ValidateNested({ each: true })
  @Type(() => OrganizerParticipationDTO)
  organizers?: OrganizerParticipationDTO[];
}
