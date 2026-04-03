import type { MissionStatus } from "./MissionStatusEnum.js";
import type { Registration } from "../registration/RegistrationModel.js";
import type { IOrganizer } from "../user/IOrganizer.js";

export interface IMission {
  uuid: string;
  name: string;
  description?: string | null;
  dateStart: Date;
  dateEnd: Date;
  address: string;
  nbrVolunteerNeeded: number;
  createdAt?: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
  /* organizers: { organizerUuid: string; isMain: boolean; isParticipant: boolean }[]; */
  organizers: IOrganizer[];
  cityId: number;
  categoryIds?: number[];
  status?: MissionStatus;
  registrations: Registration[];
  remainingPlaces?: number;
}
