import type { UserRole } from "./UserRoleEnum.js";

export interface IActor {
    getUuid(): string;
    getRole(): UserRole;
}