import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";

export class CreateMissionDto {

  @IsString()
  @MinLength(3)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  dateStart!: string;

  @IsDateString()
  dateEnd!: string;

  @IsString()
  address!: string;

  @IsInt()
  @Min(1)
  nbrVolunteerNeeded!: number;

  @IsInt()
  cityId!: number;

  @IsArray()
  @IsInt({ each: true })
  organizerIds!: number[];
}
