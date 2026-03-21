import type { CreateMissionDto } from "../../dtos/createMission.dto.js";
import { Mission } from "./mission.model.js";
import type { IMissionRepository } from "./missionRepository.interface.js";
import type { IMissionService } from "./missionService.interface.js";

export class MissionService implements IMissionService {
  constructor(private missionRepository: IMissionRepository) {}

  async createMission(missionDTO: CreateMissionDto): Promise<Mission> {
    // On regarde si il existe une mission avec le meme nom en BDD
    const existingMission = await this.missionRepository.findByName(
      missionDTO.name,
    );
    if (existingMission) {
      throw new Error("Une mission avec ce nom existe déjà.");
    }

    const organizerIds = missionDTO.organizerIds;

    const mission: Mission = new Mission({
      name: missionDTO.name,
      description: missionDTO.description || null,
      dateStart: new Date(missionDTO.dateStart),
      dateEnd: new Date(missionDTO.dateEnd),
      address: missionDTO.address,
      nbrVolunteerNeeded: missionDTO.nbrVolunteerNeeded,
      cityId: missionDTO.cityId,
      inscriptions: [],
    });

    // On cree la mission
    const result = await this.missionRepository.create(mission, organizerIds);

    // On retourne la mission au controleur
    return result;
  }
}
