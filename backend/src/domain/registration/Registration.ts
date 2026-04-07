import { MissionDateError } from "../mission/exceptions/MissionDateError.js";
import { RegistrationStatusError } from "./exceptions/RegistrationStatusError.js";
import type { RegistrationParams } from "./RegistrationParams.js";
import { RegistrationStatus } from "./RegistrationStatusEnum.js";

export class Registration {
  private date: Date;
  private recallSendAt: Date | null;
  private volunteerUuid: string;
  private missionUuid: string;
  private status: RegistrationStatus;

  constructor(param: RegistrationParams, missionUuid: string) {
    this.date = param.date;
    this.recallSendAt = param.recallSendAt || null;
    this.volunteerUuid = param.volunteerUuid;
    this.missionUuid = missionUuid;
    this.status = param.status || RegistrationStatus.ONHOLD;
  }
  public cancel() {
    if (this.status === RegistrationStatus.CANCELED) {
      return;
    }
    if (this.status === RegistrationStatus.PRESENT) {
      throw new RegistrationStatusError(
        "Cannot cancel a registration that has already been attended.",
      );
    }
    this.status = RegistrationStatus.CANCELED;
  }

  public validate() {
    if (this.status !== RegistrationStatus.ONHOLD) {
      throw new RegistrationStatusError(
        "Cannot validate a registration that is not on hold.",
      );
    }

    this.status = RegistrationStatus.VALIDATED;
  }

  public refuse() {
    if (this.status === RegistrationStatus.REFUSED) {
      return;
    }
    if (this.status !== RegistrationStatus.ONHOLD) {
      throw new RegistrationStatusError(
        "Cannot refuse a registration that is not on hold.",
      );
    }
    this.status = RegistrationStatus.REFUSED;
  }

  public setPresent() {
    if (this.status === RegistrationStatus.PRESENT) {
      return;
    }
    if (this.status !== RegistrationStatus.VALIDATED) {
      throw new RegistrationStatusError(
        "Cannot mark as present a registration that is not validated.",
      );
    }
    this.status = RegistrationStatus.PRESENT;
  }

  public setAbsent() {
    if (this.status === RegistrationStatus.ABSENT) {
      return;
    }
    if (this.status !== RegistrationStatus.VALIDATED) {
      throw new RegistrationStatusError(
        "Cannot mark as absent a registration that is not validated.",
      );
    }
    this.status = RegistrationStatus.ABSENT;
  }

  public recallMe(dateToRecall: Date) {
    if (this.status !== RegistrationStatus.VALIDATED) {
      throw new RegistrationStatusError(
        "Cannot trigger a recall for a registration that is not validated.",
      );
    }
    const now = new Date();
    if (!dateToRecall || now > dateToRecall) {
      throw new MissionDateError(
        "The recall date must exist and be in the future.",
      );
    }
    this.recallSendAt = dateToRecall;
  }

  public toResponse() {
    return {
      date: this.date,
      recallSendAt: this.recallSendAt,
      volunteerUuid: this.volunteerUuid,
      missionUuid: this.missionUuid,
      status: this.status,
    };
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
}
