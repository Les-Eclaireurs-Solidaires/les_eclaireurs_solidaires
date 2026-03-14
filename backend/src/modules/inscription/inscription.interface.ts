import type { IMission } from "../mission/mission.interface.js";
import type { IUser } from "../user/user.interface.js";
import type { InscriptionStatus } from "./inscriptionStatus.enum.js";

export interface IInscription {
  id: number;
  date: Date;
  recallSendAt?: Date;
  volunteer: IUser;
  mission: IMission;
  status: InscriptionStatus;
}
