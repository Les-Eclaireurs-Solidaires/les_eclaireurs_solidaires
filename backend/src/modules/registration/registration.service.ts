import {
  BusinessException,
  NotFoundException,
} from "../../utils/AppException.js";
import type { IMissionRepository } from "../mission/missionRepository.interface.js";
import type { IUserRepository } from "../user/user.repository.interface.js";
import { Registration } from "./registration.model.js";
import type { IRegistrationRepository } from "./registrationRepository.interface.js";
import type { IRegistrationService } from "./registrationService.interface.js";
import { RegistrationStatus } from "./registrationStatus.enum.js";

export class RegistrationService implements IRegistrationService {
  constructor(
    private missionRepository: IMissionRepository,
    private registrationRepository: IRegistrationRepository,
    private userRepository: IUserRepository,
  ) {}

  public async applyToMission(
    volunteerUuid: string,
    missionUuid: string,
  ): Promise<void> {
    const mission = await this.missionRepository.findByUuid(missionUuid);
    const user = await this.userRepository.findByUuid(volunteerUuid);

    if (!user) {
      throw new BusinessException("L'utilisateur n'existe pas.");
    }

    if (!mission) {
      throw new NotFoundException("La mission n'existe pas.");
    }

    const newRegistration = new Registration(
      {
        date: new Date(),
        volunteerUuid: volunteerUuid,
        status: RegistrationStatus.EN_ATTENTE,
      },
      missionUuid,
    );

    mission.addRegistration(newRegistration);

    await this.registrationRepository.saveRegistration(newRegistration);
  }

  public async deleteRegistration(
    targetUserUuid: string,
    requesterUuid: string,
    missionUuid: string,
  ): Promise<void> {
    const missionToApply = await this.missionRepository.findByUuid(missionUuid);
    if (!missionToApply)
      throw new NotFoundException("La mission n'existe pas.");

    

    if (
      requesterUuid != targetUserUuid &&
      !missionToApply
        .getOrganizerUuid()
        .includes(requesterUuid)
    )
      throw new BusinessException(
        "L'utilisateur n'est pas autorisé à supprimer cette inscription.",
      );

    missionToApply.removeRegistration(targetUserUuid);

    await this.registrationRepository.deleteRegistration(targetUserUuid, missionUuid);
  }
}
