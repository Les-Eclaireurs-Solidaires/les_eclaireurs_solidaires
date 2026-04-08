import type { Registration } from "../../registration/Registration.js";
import type { Organizer } from "../../user/Organizer.js";
import type { MissionStatus } from "../MissionStatusEnum.js";

export interface MissionParam {
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
  categoryIds?: number[];
  status?: MissionStatus;
  registrations: Registration[];
}
