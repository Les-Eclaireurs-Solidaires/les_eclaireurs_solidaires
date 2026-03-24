import type { MissionStatus } from "./missionStatus.enum.js";
import type { Registration } from "../registration/registration.model.js";

export interface IMission {
  uuid?: string;
  name: string;
  description?: string | null;
  dateStart: Date;
  dateEnd: Date;
  address: string;
  nbrVolunteerNeeded: number;
  createdAt?: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
  organizerUuids: string[];
  cityId: number;
  status?: MissionStatus;
  registrations?: Registration[];
}
