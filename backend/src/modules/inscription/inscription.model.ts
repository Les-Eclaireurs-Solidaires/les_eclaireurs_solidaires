import  { Mission } from "../mission/mission.model.js";
import { User } from "../user/user.model.js";
import type { IInscription } from "./inscription.interface.js";
import { InscriptionStatus } from "./inscriptionStatus.enum.js";

export class Inscription{

  private id: number;
  private date: Date;
  private recallSendAt: Date | null;
  private volunteer: User;
  private mission: Mission;
  private status: InscriptionStatus;

  constructor(param: IInscription, mission: Mission) {
    this.id = param.id;
    this.date = param.date || new Date();
    this.recallSendAt = param.recallSendAt || null;
    this.volunteer = new User(param.volunteer);
    this.mission = mission;
    this.status = param.status || InscriptionStatus.EN_ATTENTE;
  }

  getStatus(): InscriptionStatus {
    return this.status;
  }

  setStatus(status: InscriptionStatus): void {
    this.status = status;
  }

}