export interface IRegistrationService {
  registerVolunteer(volunteerUuid: string, missionUuid: string): Promise<void>;
  cancelRegistration(
    targetUuid: string,
    requesterUuid: string,
    missionUuid: string,
  ): Promise<void>;
}
