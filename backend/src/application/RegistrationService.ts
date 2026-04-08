import { MissionNotFoundError } from "../domain/mission/exceptions/MissionNotFoundError.js";
import type { IMissionRepository } from "../domain/mission/interfaces/IMissionRepository.js";
import type { IRegistrationRepository } from "../domain/registration/IRegistrationRepository.js";
import type { IRegistrationService } from "../domain/registration/IRegistrationService.js";
import { Registration } from "../domain/registration/Registration.js";
import { RegistrationStatus } from "../domain/registration/RegistrationStatusEnum.js";
import { UserNotFoundError } from "../domain/user/exceptions/UserNotFoundError.js";
import type { IUserRepository } from "../domain/user/IUserRepository.js";


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
    /* const newRegistration = new Registration(
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
    ); */

    /* this.missionRepository.update(mission); */
  }
}
