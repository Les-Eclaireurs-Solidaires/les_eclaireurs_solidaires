import type { RegistrationStatus } from "./RegistrationStatusEnum.js";

export interface IRegistration {
  date: Date;
  recallSendAt?: Date;
  volunteerUuid: string;
  status?: RegistrationStatus;
}
