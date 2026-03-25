import type { RegistrationStatus } from "./RegistrationStatusEnum.js";

export interface IRegistration {
  id?: number;
  date: Date;
  recallSendAt?: Date;
  volunteerUuid: string;
  status: RegistrationStatus;
}
