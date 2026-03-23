import type { IUser } from "../user/user.interface.js";
import type { RegistrationStatus } from "./registrationStatus.enum.js";

export interface IRegistration {
  id?: number;
  date: Date;
  recallSendAt?: Date;
  volunteer: IUser;
  status: RegistrationStatus;
}
