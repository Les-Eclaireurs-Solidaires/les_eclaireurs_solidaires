import { MissionNotFoundError } from "../exceptions/mission/MissionNotFoundError.js";
import { UserNotFoundError } from "../exceptions/auth/UserNotFoundError.js";
import type { IMissionRepository } from "../mission/IMissionRepository.js";
import type { IUserRepository } from "../user/IUserRepository.js";
import { Registration } from "./RegistrationModel.js";
import type { IRegistrationRepository } from "./IRegistrationRepository.js";
import type { IRegistrationService } from "./IRegistrationService.js";
import { RegistrationStatus } from "./RegistrationStatusEnum.js";
import { UnauthorizedCancelRegistrationError } from "../exceptions/registration/UnauthorizedCancelRegistrationError.js";
import { UserRole } from "../user/UserRoleEnum.js";

export class RegistrationService implements IRegistrationService {
  constructor(
    private missionRepository: IMissionRepository,
    private registrationRepository: IRegistrationRepository,
    private userRepository: IUserRepository,
  ) {}
  cancelRegistration(
    targetUserUuid: string,
    requesterUuid: string,
    missionUuid: string,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
  validateRegistration(
    targetUserUuid: string,
    missionUuid: string,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public async registerVolunteer(
    volunteerUuid: string,
    missionUuid: string,
  ): Promise<void> {
    const mission = await this.missionRepository.findByUuid(missionUuid);
    const user = await this.userRepository.findByUuid(volunteerUuid);

    if (!user) {
      throw new UserNotFoundError();
    }

    if (!mission) {
      throw new MissionNotFoundError();
    }
    const newRegistration = new Registration(
      {
        date: new Date(),
        status: RegistrationStatus.ONHOLD,
        volunteerUuid: volunteerUuid,
      },
      missionUuid,
    );
    mission.addRegistration(newRegistration);

    await this.registrationRepository.saveRegistration(
      newRegistration,
      missionUuid,
    );

    this.missionRepository.update(mission);
  }
}
