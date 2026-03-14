import type { MissionStatus } from "../mission_status/missionStatus.enum.js";
import type { IInscription } from "../inscription/inscription.interface.js";


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
  cityId: number;
  status: MissionStatus;
  inscriptions: IInscription[];
}

