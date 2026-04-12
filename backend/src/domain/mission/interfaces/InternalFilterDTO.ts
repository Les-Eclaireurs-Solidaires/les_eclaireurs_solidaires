import type { MissionStatus } from "../MissionStatusEnum.js";

export interface InternalFilterDTO{
    status:MissionStatus[];
    onlyMissions:boolean;
    actorUuid?: string;

    cityId?: number;
    categoryIds?:number[];
    name?:string;
    dateStart?:Date;
    address?:string;
}