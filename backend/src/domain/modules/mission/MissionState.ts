import type { Mission } from "../../mission/Mission.js";
import { MissionStatus } from "../../mission/MissionStatusEnum.js";
import type { Registration } from "../../registration/RegistrationModel.js";
import { RegistrationStatus } from "../../registration/RegistrationStatusEnum.js";
import { GeolocalizationError } from "../../exceptions/mission/GeolocalizationError.js";
import { MissionDateError } from "../../exceptions/mission/MissionDateError.js";
import { MissionStatusError } from "../../exceptions/mission/MissionStatusError.js";

export abstract class MissionState {
  abstract validate(mission: Mission): void;
  abstract update(mission: Mission): void;

  abstract publish(mission: Mission): void;
  abstract cancel(mission: Mission): void;
  abstract finished(mission: Mission): void;
  abstract delete(mission: Mission): void;

  abstract addRegistration(mission: Mission, registration: Registration): void;
  abstract removeRegistration(mission: Mission): void;
  abstract cancelRegistration(mission: Mission, targetUuid: string): void;
  abstract validateRegistration(mission: Mission, targetUuid: string): void;
  abstract refuseRegistration(mission: Mission, targetUuid: string): void;

  protected validateBasicInfo(mission: Mission): void {
    if (!mission.getUuid()) throw new MissionStatusError("Uuid obligatoire.");
    if (!mission.getName() || mission.getName().trim() === "")
      throw new MissionStatusError("Nom de la mission obligatoire.");
    if (!mission.getDescription())
      throw new MissionStatusError("Description de la mission obligatoire.");
    if (mission.getDescription()?.trim() === "")
      throw new MissionStatusError("Description de la mission obligatoire.");
    if (mission.getNbrVolunteerNeeded() <= 0)
      throw new MissionStatusError(
        "Nombre de participants obligatoire et supérieur à 0.",
      );
  }
  protected validateLocalisation(mission: Mission): void {
    if (!mission.getAddress())
      throw new GeolocalizationError("Adresse obligatoire.");
    if (mission.getAddress()?.trim() === "")
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
    if (dateStart.getTime() >= dateEnd.getTime())
      throw new MissionDateError(
        "Date de début doit être antérieure à la date de fin.",
      );
  }
  protected validateOrganizerValid(mission: Mission): void {
    if (!mission.getOrganizers() || mission.getOrganizers().length === 0)
      throw new MissionStatusError("Organisateur obligatoire.");

    const mainOrganizerCount = mission
      .getOrganizers()
      .filter((organizer) => organizer.isMain).length;

    if (mainOrganizerCount !== 1)
      throw new MissionStatusError(
        "Il doit y avoir un seul organisateur principal.",
      );

    const organizerUuids = mission
      .getOrganizers()
      .map((organizer) => organizer.organizerUuid);
    const uniqueUuids = new Set(organizerUuids);
    if (uniqueUuids.size !== organizerUuids.length)
      throw new MissionStatusError("Les organisateurs doivent être uniques.");
  }
  protected validateCategoryValid(mission: Mission): void {
    if (!mission.getCategoryIds())
      throw new MissionStatusError("Catégorie obligatoire.");
    if (mission.getCategoryIds()?.length === 0)
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
