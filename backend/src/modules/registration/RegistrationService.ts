import { MissionNotFoundError } from "../../domain/exceptions/mission/MissionNotFoundError.js";
import { UserNotFoundError } from "../../domain/exceptions/auth/UserNotFoundError.js";
import type { IMissionRepository } from "../mission/IMissionRepository.js";
import type { IUserRepository } from "../user/IUserRepository.js";
import { Registration } from "./RegistrationModel.js";
import type { IRegistrationRepository } from "./IRegistrationRepository.js";
import type { IRegistrationService } from "./IRegistrationService.js";
import { RegistrationStatus } from "./RegistrationStatusEnum.js";
import { UnauthorizedCancelRegistrationError } from "../../domain/exceptions/registration/UnauthorizedCancelRegistrationError.js";

export class RegistrationService implements IRegistrationService {
  constructor(
    private missionRepository: IMissionRepository,
    private registrationRepository: IRegistrationRepository,
    private userRepository: IUserRepository,
  ) {}

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
        volunteerUuid: volunteerUuid,
        status: RegistrationStatus.EN_ATTENTE,
      },
      missionUuid,
    );

    mission.addRegistration(newRegistration);

    await this.registrationRepository.saveRegistration(newRegistration);
  }

  public async cancelRegistration(
    targetUserUuid: string,
    requesterUuid: string,
    missionUuid: string,
  ): Promise<void> {
    const missionToApply = await this.missionRepository.findByUuid(missionUuid);
    const requesterUser = await this.userRepository.findByUuid(requesterUuid);

    if (!missionToApply) throw new MissionNotFoundError();

    if (!requesterUser) throw new UserNotFoundError();

    const isSelf = requesterUuid === targetUserUuid;

    const isOrganizer = missionToApply
      .getOrganizerUuid()
      .includes(requesterUuid);
    const isSuperAdmin = requesterUser.getRoleId() === 1;

    if (!isSelf && !isOrganizer && !isSuperAdmin)
      throw new UnauthorizedCancelRegistrationError();

    const registrationStatus = isSelf
      ? RegistrationStatus.ANNULEE
      : RegistrationStatus.REFUSEE;

    missionToApply.removeRegistration(targetUserUuid, registrationStatus);

    await this.registrationRepository.updateRegistrationStatus(
      targetUserUuid,
      missionUuid,
      registrationStatus,
    );
  }
}
