import { Registration } from "../registration/registration.model";
import { Organizer } from "./interfaces/MissionDTO";

export interface MissionFromApi {
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
  organizers: Organizer[];
  cityId: number;
  categories: number[];
  status?: MissionStatus;
  registrations?: Registration[];
}

export enum MissionStatus {
  DRAFT = 1,
  PUBLISHED = 2,
  FINISHED = 3,
  CANCELED = 4,
}
