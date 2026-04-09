import { IMissionResponse, IRegistration, MissionStatus } from "../mission-response.interface";

export class MissionModel {
    uuid: string;
    name: string;
    description?: string | null;
    dateStart: Date;
    dateEnd: Date;
    address: string;
    nbrVolunteerNeeded: number;
    createdAt?: Date;
    updatedAt?: Date | null;
    deletedAt?: Date | null;
    organizerUuids: string[];
    cityId: number;
    status?: MissionStatus;
    registrations: IRegistration[];
    remainingPlaces?: number;
    isFull?: boolean;

    constructor(mission: IMissionResponse){
        this.uuid = mission.uuid;
        this.name = mission.name;
        this.description = mission.description;
        this.dateStart = new Date(mission.dateStart);
        this.dateEnd = new Date(mission.dateEnd);
        this.address = mission.address;
        this.nbrVolunteerNeeded = mission.nbrVolunteerNeeded;
        this.createdAt = mission.createdAt ? new Date(mission.createdAt) : new Date();
        this.updatedAt = mission.updatedAt ? new Date(mission.updatedAt) : null;
        this.deletedAt = mission.deletedAt ? new Date(mission.deletedAt) : null;
        this.organizerUuids = mission.organizerUuids;
        this.cityId = mission.cityId;
        this.status = mission.status;
        this.registrations = mission.registrations || [];

    }
}
