import type { Mission } from "../Mission.js";

export interface IDashboardMission{
    created: Mission[];
    organized: Mission[];
    participated: Mission[];
}