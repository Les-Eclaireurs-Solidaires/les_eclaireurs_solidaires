import type { IRegistration } from "./IRegistrationModel.js";
import { RegistrationStatus } from "./RegistrationStatusEnum.js";

export class Registration {
  private id: number | undefined;
  private date: Date;
  private recallSendAt: Date | null;
  private volunteerUuid: string;
  private missionUuid: string;
  private status: RegistrationStatus;

  constructor(param: IRegistration, missionUuid: string) {
    this.id = param.id || undefined;
    this.date = param.date || new Date();
    this.recallSendAt = param.recallSendAt || null;
    this.volunteerUuid = param.volunteerUuid;
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
  getVolunteerUuid(): string {
    return this.volunteerUuid;
  }

  getStatus(): RegistrationStatus {
    return this.status;
  }

  setStatus(status: RegistrationStatus): void {
    this.status = status;
  }
}
