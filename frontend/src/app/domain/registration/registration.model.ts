export enum RegistrationStatus {
  ONHOLD = 1,
  VALIDATED = 2,
  REFUSED = 3,
  CANCELED = 4,
  PRESENT = 5,
  ABSENT = 6,
}

export class Registration {
  private date: Date;
  private recallSendAt?: Date;
  private volunteerUuid: string;
  private status: RegistrationStatus;

  private constructor(
    date: Date,
    volunteerUuid: string,
    status: RegistrationStatus,
    recallSendAt?: Date,
  ) {
    this.date = date;
    this.recallSendAt = recallSendAt;
    this.volunteerUuid = volunteerUuid;
    this.status = status;
  }

  public static create(
    date: Date,
    volunteerUuid: string,
    status: RegistrationStatus,
    recallSendAt?: Date,
  ): Registration {
    return new Registration(date, volunteerUuid, status, recallSendAt);
  }

  public getDate(): Date {
    return this.date;
  }

  public getRecallSendAt(): Date | undefined {
    return this.recallSendAt;
  }

  public getVolunteerUuid(): string {
    return this.volunteerUuid;
  }

  public getStatus(): RegistrationStatus {
    return this.status;
  }
}
