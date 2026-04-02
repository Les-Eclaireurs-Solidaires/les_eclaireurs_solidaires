import { MissionDateError } from "../../domain/exceptions/mission/MissionDateError.js";
import { RegistrationStatusError } from "../../domain/exceptions/registration/RegistrationStatusError.js";
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
    this.status = param.status || RegistrationStatus.ONHOLD;
  }
  public cancel() {
    if (this.status === RegistrationStatus.CANCELLED) {
      return;
    }
    if (this.status === RegistrationStatus.PRESENT) {
      throw new RegistrationStatusError(
        "Impossible d'annuler une inscription déja participée.",
      );
    }
    this.status = RegistrationStatus.CANCELLED;
  }

  public validate() {
    if (this.status !== RegistrationStatus.ONHOLD) {
      throw new RegistrationStatusError(
        "Impossible de valider une inscription qui n'est pas en attente.",
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
        "Impossible de refuser une inscription qui n'est pas en attente.",
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
        "Impossible de régler la présence d'une inscription qui n'est pas validée.",
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
        "Impossible de régler l'absence d'une inscription qui n'est pas validée.",
      );
    }
    this.status = RegistrationStatus.ABSENT;
  }

  public recallMe(dateToRecall: Date) {
    if (this.status !== RegistrationStatus.VALIDATED) {
      throw new RegistrationStatusError(
        "Impossible de rappeler une inscription qui n'est pas validée.",
      );
    }
    const now = new Date();
    if (!dateToRecall || now > dateToRecall) {
      throw new MissionDateError(
        "La date de rappel doit exister et être dans le futur.",
      );
    }
    this.recallSendAt = dateToRecall;
  }

  public toResponse() {
    return {
      id: this.id,
      date: this.date,
      recallSendAt: this.recallSendAt,
      volunteerUuid: this.volunteerUuid,
      missionUuid: this.missionUuid,
      status: this.status,
    };
  }

  public getId(): number | undefined {
    return this.id;
  }

   getMissionUuid(): string {
    return this.missionUuid;
  }/*
  getDate(): Date {
    return this.date;
  }

  getRecallSendAt(): Date | null {
    return this.recallSendAt;
  }*/
  getVolunteerUuid(): string {
    return this.volunteerUuid;
  }

  getStatus(): RegistrationStatus {
    return this.status;
  }
}
