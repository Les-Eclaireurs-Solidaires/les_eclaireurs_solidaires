import type { UpdateMissionDTO } from "../../presentation/dto/mission/UpdateMissionDTO.js";
import type { Registration } from "../registration/Registration.js";
import { RegistrationStatus } from "../registration/RegistrationStatusEnum.js";
import { GeolocalizationError } from "./exceptions/GeolocalizationError.js";
import { MissionDateError } from "./exceptions/MissionDateError.js";
import { MissionStatusError } from "./exceptions/MissionStatusError.js";
import type { Mission } from "./Mission.js";
import { MissionStatus } from "./MissionStatusEnum.js";

export abstract class MissionState {
  abstract validate(mission: Mission): void;
  abstract update(mission: Mission, dto: UpdateMissionDTO): void;

  abstract publish(mission: Mission): void;
  abstract cancel(mission: Mission): void;
  abstract finished(mission: Mission): void;
  abstract delete(mission: Mission): void;

  abstract addRegistration(mission: Mission, registration: Registration): void;
  abstract removeRegistration(mission: Mission, registration: Registration): void;
  abstract cancelRegistration(mission: Mission, targetUuid: string): void;
  abstract validateRegistration(mission: Mission, targetUuid: string): void;
  abstract refuseRegistration(mission: Mission, targetUuid: string): void;

  protected validateRealityInvariant(mission: Mission):void {
    if (
      mission.getNbrVolunteerNeeded() !== undefined &&
      mission.getNbrVolunteerNeeded() !== null &&
      mission.getNbrVolunteerNeeded() < 0
    ) {
      throw new Error("Le nombre de bénévoles ne peut pas être négatif.");
    }
    if (
      mission.getDateStart() &&
      mission.getDateEnd() &&
      mission.getDateStart().getTime() >= mission.getDateEnd().getTime()
    ) {
      throw new MissionDateError(
        "La date de fin doit être après la date de début.",
      );
    }
    
  }
  protected validateBusinessInvariant(mission: Mission): void {
    if (!mission.getName() || mission.getName().trim() === "") {
      throw new MissionStatusError("Une mission doit au moins avoir un nom.");
    }
    const mains = mission
      .getOrganizers()
      .filter((organizer) => organizer.isMain).length;
    if (mains !== 1) {
      throw new MissionStatusError(
        "Une mission doit avoir un seul organisateur principal.",
      );
    }
  }
  protected validateBasicInfo(mission: Mission): void {
    if (!mission.getUuid()) throw new MissionStatusError("Uuid obligatoire.");
    if (!mission.getDescription() || mission.getDescription()?.trim() === "")
      throw new MissionStatusError("Description de la mission obligatoire.");
  }
  protected validateLocalisation(mission: Mission): void {
    if (!mission.getAddress() || mission.getAddress()?.trim() === "")
      throw new GeolocalizationError("Adresse obligatoire.");
    if (!mission.getCityId())
      throw new GeolocalizationError("Ville obligatoire.");
  }
  protected validateDateCoherence(mission: Mission): void {
    const now = new Date();
    const dateStart = mission.getDateStart();
    const dateEnd = mission.getDateEnd();
    if (!dateStart || !dateEnd) throw new MissionDateError("Date obligatoire.");
    if (dateStart.getTime() < now.getTime())
      throw new MissionDateError("Date de début doit être dans le futur.");
  }
  protected validateOrganizerValid(mission: Mission): void {
    const organizerUuids = mission
      .getOrganizers()
      .map((organizer) => organizer.organizerUuid);
    const uniqueUuids = new Set(organizerUuids);
    if (uniqueUuids.size !== organizerUuids.length)
      throw new MissionStatusError("Les organisateurs doivent être uniques.");
  }
  protected validateCategoryValid(mission: Mission): void {
    if (!mission.getCategoryIds() || mission.getCategoryIds()?.length === 0)
      throw new MissionStatusError("Catégorie obligatoire.");
  }
  protected isRegistrationOpen(mission: Mission): boolean {
    const now = new Date();
    return (
      mission.getStatus() === MissionStatus.PUBLISHED &&
      now >= mission.getDateStart() &&
      now <= mission.getDateEnd()
    );
  }
  protected getAvailablePlacesCount(mission: Mission): number {
    const validRegistration = mission
      .getRegistrations()
      .filter(
        (registration) =>
          registration.getStatus() === RegistrationStatus.VALIDATED ||
          registration.getStatus() === RegistrationStatus.ONHOLD,
      );
    return Math.max(
      0,
      mission.getNbrVolunteerNeeded() - validRegistration.length,
    );
  }
  protected hasAvailablePlaces(mission: Mission): boolean {
    return this.getAvailablePlacesCount(mission) > 0;
  }
}
