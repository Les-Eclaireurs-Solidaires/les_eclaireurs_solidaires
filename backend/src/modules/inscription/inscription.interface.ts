import type { IUser } from "../user/user.interface.js";
import type { InscriptionStatus } from "./inscriptionStatus.enum.js";

export interface IInscription {
  id: number;
  date: Date;
  recallSendAt?: Date;
  volunteer: IUser;
  missionUuid: string;
  status: InscriptionStatus;
}
