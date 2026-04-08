import type { PoolConnection } from "mysql2/promise";
import type { IRegistrationRepository } from "../../../domain/registration/IRegistrationRepository.js";
import type { IMissionRepository } from "../../../domain/mission/interfaces/IMissionRepository.js";
import type { RegistrationsUpdateEvent } from "../../../domain/mission/event/RegistrationsUpdateEvent.js";
import type { MissionHardDeleteEvent } from "../../../domain/mission/event/MissionHardDeleteEvent.js";
import type { OrganizersUpdateEvent } from "../../../domain/mission/event/OrganizersUpdateEvent.js";

export class EventHandler {
  constructor(
    private registrationRepository: IRegistrationRepository,
    private missionRepository: IMissionRepository,
  ) {}

  public async handleRegistrationsUpdateEvent(
    event: RegistrationsUpdateEvent,
    connection: PoolConnection,
  ): Promise<void> {
    const mission = event.mission;

    if (mission.getRegistrations() && mission.getRegistrations().length > 0) {
      for (const registration of mission.getRegistrations()) {
        await this.registrationRepository.saveRegistration(
          registration,
          mission.getUuid(),
          connection,
        );
      }
    }
  }

  public async handleOrganizersUpdateEvent(
    event: OrganizersUpdateEvent,
    connection: PoolConnection,
  ): Promise<void> {
    const mission = event.mission;

    if (mission.getOrganizers() && mission.getOrganizers().length > 0) {
      await this.missionRepository.updateOrganizers(mission, connection);
    }
  }

  public async handleMissionHardDeleteEvent(
    event: MissionHardDeleteEvent,
    connection: PoolConnection,
  ): Promise<void> {
    const missionUuid = event.missionUuid;

    await this.missionRepository.delete(missionUuid, connection);
  }
}
