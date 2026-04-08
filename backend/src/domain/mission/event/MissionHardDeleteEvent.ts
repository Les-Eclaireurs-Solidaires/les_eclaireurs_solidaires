import type { IDomainEvent } from "../../IDomainEvent.js";
import type { Mission } from "../Mission.js";

export class MissionHardDeleteEvent implements IDomainEvent {
  public readonly eventName: string = "MissionHardDelete";
  public readonly appearsOn: Date;

  constructor(public readonly missionUuid: string) {
    this.appearsOn = new Date();
  }
}
