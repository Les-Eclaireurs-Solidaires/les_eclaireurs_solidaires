import type { IDomainEvent } from "../../IDomainEvent.js";
import type { Mission } from "../Mission.js";

export class OrganizersUpdateEvent implements IDomainEvent {
  public readonly eventName: string = "UpdateOrganizers";
  public readonly appearsOn: Date;

  constructor(public readonly mission: Mission) {
    this.appearsOn = new Date();
  }
}
