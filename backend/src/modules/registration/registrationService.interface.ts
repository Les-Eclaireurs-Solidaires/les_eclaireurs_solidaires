export interface IRegistrationService{
    applyToMission(volunteerUuid:string,missionUuid:string):Promise<void>;
    deleteRegistration(targetUuid:string,requesterUuid:string,missionUuid:string):Promise<void>;
}