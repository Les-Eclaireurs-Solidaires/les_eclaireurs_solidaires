import { IsBoolean, IsUUID } from "class-validator";

export class OrganizerParticipationDTO {
  @IsUUID("4", { message: "L'UUID de l'organisateur est invalide." })
  organizerUuid!: string;

  @IsBoolean()
  isMain!: boolean;

  @IsBoolean()
  isParticipant!: boolean;
}