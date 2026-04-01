import { Transform } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({ name: "ValidateDateEnd", async: false })
export class DateValidator implements ValidatorConstraintInterface {
  validate(dateEndString: string, args: ValidationArguments) {
    const dto = args.object as CreateMissionDTO;
    const dateStartString = dto.dateStart;

    const dateStart = new Date(dateStartString);
    const dateEnd = new Date(dateEndString);

    if (isNaN(dateStart.getTime()) || isNaN(dateEnd.getTime())) {
      return true;
    }

    return dateStart < dateEnd;
  }

  defaultMessage() {
    return "La date de début doit être antérieure à la date de fin.";
  }
}
@ValidatorConstraint({ name: "ValidateDateStart", async: false })
export class IsFutureDate implements ValidatorConstraintInterface {
  validate(value: string) {
    const dateToValidate = new Date(value);

    if (isNaN(dateToValidate.getTime())) {
      return true;
    }

    return dateToValidate >= new Date();
  }

  defaultMessage() {
    return "La date doit être dans le futur.";
  }
}
export class CreateMissionDTO {
  @IsString()
  @MinLength(3, { message: "Le nom doit contenir au moins 3 caractères" })
  @MaxLength(255, { message: "Le nom ne doit pas dépasser 255 caractères" })
  @Transform(({ value }) => value?.trim())
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000, {
    message: "La description est trop longue.",
  })
  description?: string;

  @IsDateString({}, { message: "La date de début n'est pas au bon format." })
  @Validate(IsFutureDate)
  dateStart!: string;

  @IsDateString({}, { message: "La date de fin n'est pas au bon format." })
  @Validate(DateValidator)
  dateEnd!: string;

  @IsString()
  @MaxLength(255, {
    message: "L'adresse ne doit pas dépasser 255 caractères.",
  })
  @Transform(({ value }) => value.trim())
  address!: string;

  @IsInt()
  @Min(1)
  nbrVolunteerNeeded!: number;

  @IsInt()
  cityId!: number;

  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  categoryIds?: number[];

  @IsArray()
  @ArrayNotEmpty({
    message: "Le tableau des organisateurs ne doit pas être vide",
  })
  @IsUUID("4", {
    each: true,
    message: "Les identifiants des organisateurs sont invalides.",
  })
  organizerUuids!: string[];

  @IsBoolean()
  toPublish!: boolean;
}
