import type { RegistrationStatus } from "./RegistrationStatusEnum.js";

export interface RegistrationParams {
  date: Date;
  recallSendAt?: Date;
  volunteerUuid: string;
  status?: RegistrationStatus;
}
