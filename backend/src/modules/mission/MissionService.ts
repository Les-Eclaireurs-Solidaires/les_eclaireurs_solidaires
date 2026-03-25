import { MissionNameAlreadyExistError } from "../../domain/exceptions/mission/MissionNameAlreadyExistError.js";
import { Mission } from "./MissionModel.js";
import crypto from "crypto";
import type { IMissionRepository } from "./IMissionRepository.js";
import type { IMissionService } from "./IMissionService.js";
import type { CreateMissionDTO } from "./dtos/CreateMissionDTO.js";

export class MissionService implements IMissionService {
  constructor(private missionRepository: IMissionRepository) {}

  async createMission(missionDTO: CreateMissionDTO): Promise<Mission> {
    // On regarde si il existe une mission avec le meme nom en BDD
    const existingMission = await this.missionRepository.findByName(
      missionDTO.name,
    );
    if (existingMission) {
      throw new MissionNameAlreadyExistError(missionDTO.name);
    }

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
}
