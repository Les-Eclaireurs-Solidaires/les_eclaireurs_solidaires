
export interface IRegistrationService{

    applyToMission(volunteerUuid:string,missionUuid:string):Promise<void>;
    
}