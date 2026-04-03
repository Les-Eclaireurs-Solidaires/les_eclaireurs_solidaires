export interface IRegistrationService {
   registerVolunteer(volunteerUuid: string, missionUuid: string): Promise<void>; 
   cancelRegistration(targetUserUuid: string, requesterUuid: string, missionUuid: string): Promise<void>;
   validateRegistration(targetUserUuid: string, missionUuid: string): Promise<void>;
   
}
