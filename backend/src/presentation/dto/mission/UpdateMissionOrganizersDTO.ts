import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  ValidateNested,
} from "class-validator";
import { OrganizerParticipationDTO } from "./OrganizerParticipationDTO.js";

export class UpdateMissionOrganizersDTO {
  
  @ArrayNotEmpty({
    message: "Une mission doit avoir au moins un organisateur.",
  })
  @ValidateNested({ each: true })
  @Type(() => OrganizerParticipationDTO)
  organizers!: OrganizerParticipationDTO[];
}
