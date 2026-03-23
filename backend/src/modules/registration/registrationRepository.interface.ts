import type { Registration } from "./registration.model.js";

export interface IRegistrationRepository{
    saveRegistration(registration:Registration):Promise<void>;

}