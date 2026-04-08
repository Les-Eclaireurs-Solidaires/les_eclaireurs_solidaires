import type { IDomainEvent } from "../../IDomainEvent.js";
import type { Mission } from "../Mission.js";

export class RegistrationsUpdateEvent implements IDomainEvent {
  public readonly eventName: string = "RegistrationsSave";
  public readonly appearsOn: Date;

  constructor(public readonly mission: Mission) {
    this.appearsOn = new Date();
  }
}
