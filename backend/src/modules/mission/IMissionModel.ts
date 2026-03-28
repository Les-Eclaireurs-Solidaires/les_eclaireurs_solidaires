import type { MissionStatus } from "./MissionStatusEnum.js";
import type { Registration } from "../registration/RegistrationModel.js";

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
  organizerUuids: string[];
  cityId: number;
  status?: MissionStatus;
  registrations: Registration[];
  remainingPlaces?: number;
  isFull?: boolean;
}
