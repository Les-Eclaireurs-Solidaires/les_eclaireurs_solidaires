import {
  BusinessException,
  NotFoundException,
} from "../../utils/AppException.js";
import type { IMissionRepository } from "../mission/missionRepository.interface.js";
import type { IUser } from "../user/user.interface.js";
import { User } from "../user/user.model.js";
import { Registration } from "./registration.model.js";
import type { IRegistrationRepository } from "./registrationRepository.interface.js";
import type { IRegistrationService } from "./registrationService.interface.js";
import { RegistrationStatus } from "./registrationStatus.enum.js";

export class RegistrationService implements IRegistrationService {
  constructor(
    private missionRepository: IMissionRepository,
    private registrationRepository: IRegistrationRepository,
  ) {}

  public async applyToMission(
    volunteerUuid: string,
    missionUuid: string,
  ): Promise<void> {
    const mission = await this.missionRepository.findByUuid(missionUuid);

    if (!mission) {
      throw new NotFoundException("La mission n'existe pas.");
    }

    const newRegistration = new Registration({
      date: new Date(),
      volunteer: {
        uuid: volunteerUuid
      } as IUser,
      status: RegistrationStatus.EN_ATTENTE,
    }, missionUuid);

    mission.addRegistration(newRegistration);


    await this.registrationRepository.saveRegistration(newRegistration)
  }
}
