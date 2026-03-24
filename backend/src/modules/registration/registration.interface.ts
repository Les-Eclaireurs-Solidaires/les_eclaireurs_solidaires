import type { IUser } from "../user/user.interface.js";
import type { User } from "../user/user.model.js";
import type { RegistrationStatus } from "./registrationStatus.enum.js";

export interface IRegistration {
  id?: number;
  date: Date;
  recallSendAt?: Date;
  volunteerUuid: string;
  status: RegistrationStatus;
}
