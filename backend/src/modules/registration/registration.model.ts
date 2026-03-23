import { User } from "../user/user.model.js";
import type { IRegistration } from "./registration.interface.js";
import { RegistrationStatus } from "./registrationStatus.enum.js";


export class Registration {
  private id: number;
  private date: Date;
  private recallSendAt: Date | null;
  private volunteer: User;
  private missionUuid: string;
  private status: RegistrationStatus;

  constructor(param: IRegistration, missionUuid: string) {
    this.id = param.id || 0;
    this.date = param.date || new Date();
    this.recallSendAt = param.recallSendAt || null;
    this.volunteer = new User(param.volunteer);
    this.missionUuid = missionUuid;
    this.status = param.status || RegistrationStatus.EN_ATTENTE;
  }
  getMissionUuid(): string {
    return this.missionUuid;
  }
  getDate(): Date {
    return this.date;
  }

  getRecallSendAt(): Date | null {
    return this.recallSendAt;
  }
  getVolunteer(): User {
    return this.volunteer;
  }

  getStatus(): RegistrationStatus {
    return this.status;
  }

  setStatus(status: RegistrationStatus): void {
    this.status = status;
  }
}
