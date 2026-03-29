import { MissionNameAlreadyExistError } from "../../domain/exceptions/mission/MissionNameAlreadyExistError.js";
import { Mission } from "./MissionModel.js";
import crypto from "crypto";
import type { IMissionRepository } from "./IMissionRepository.js";
import type { IMissionService } from "./IMissionService.js";
import type { CreateMissionDTO } from "./dtos/CreateMissionDTO.js";
import { MissionNotFoundError } from "../../domain/exceptions/mission/MissionNotFoundError.js";
import { UserRole } from "../user/UserRoleEnum.js";
import { UnauthorizedCancelMissionError } from "../../domain/exceptions/mission/UnauthorizedCancelMissionError.js";
import type { SearchMission } from "./payload/SearchMission.js";
import type { SearchMissionDTO } from "./dtos/SearchMissionDTO.js";
import { MissionStatus } from "./MissionStatusEnum.js";

export class MissionService implements IMissionService {
  constructor(private missionRepository: IMissionRepository) {}

  async createMission(missionDTO: CreateMissionDTO): Promise<Mission> {
    const organizerIds = missionDTO.organizerIds;

    const mission: Mission = new Mission({
      uuid: crypto.randomUUID(),
      name: missionDTO.name,
      description: missionDTO.description || null,
      dateStart: new Date(missionDTO.dateStart),
      dateEnd: new Date(missionDTO.dateEnd),
      address: missionDTO.address,
      nbrVolunteerNeeded: missionDTO.nbrVolunteerNeeded,
      cityId: missionDTO.cityId,
      organizerUuids: organizerIds.map((id) => id.toString()),
      registrations: [],
    });

    // On cree la mission
    const result = await this.missionRepository.create(mission, organizerIds);

    // On retourne la mission au controleur
    return result;
  }
  async cancelMission(
    missionUuid: string,
    requesterUuid: string,
    roleID: UserRole,
  ): Promise<void> {
    const mission = await this.missionRepository.findByUuid(missionUuid);

    if (!mission) {
      throw new MissionNotFoundError();
    }

    const isSuperAdmin = roleID === UserRole.SUPER_ADMIN;
    const isOrganizer = mission.getOrganizerUuid().includes(requesterUuid);

    if (!isSuperAdmin && !isOrganizer) {
      throw new UnauthorizedCancelMissionError(
        "Seul l'organisateur de la mission ou l'administrateur peuvent annuler la mission.",
      );
    }

    mission.cancel();

    await this.missionRepository.update(mission);
  }

  async getMission(missionUuid: string): Promise<Mission> {
    const missionToSend = await this.missionRepository.findByUuid(missionUuid);

    if (!missionToSend) {
      throw new MissionNotFoundError();
    }

    return missionToSend;
  }

  async getMissions(filters: SearchMissionDTO): Promise<Mission[]> {
    const searchPayload: SearchMission = {};
    if (filters.status !== undefined) {
      searchPayload.status = filters.status;
    }
    if (filters.cityId !== undefined) {
      searchPayload.cityId = filters.cityId;
    }
    if (filters.dateStart !== undefined) {
      const startDate = new Date(filters.dateStart);
      startDate.setHours(0, 0, 0, 0);
      searchPayload.dateStart = startDate;

      const toDate = new Date(startDate);
      toDate.setDate(startDate.getDate() + 1);
      searchPayload.dateToDate = toDate;
    }
    if (filters.name !== undefined) {
      searchPayload.name = filters.name;
    }    

    const missions = await this.missionRepository.findMany(searchPayload);

    return missions;
  }
}
