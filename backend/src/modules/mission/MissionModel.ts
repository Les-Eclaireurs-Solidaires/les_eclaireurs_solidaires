import { MissionStatus } from "./MissionStatusEnum.js";
import type { IMission } from "./IMissionModel.js";
import { Registration } from "../registration/RegistrationModel.js";
import { RegistrationStatus } from "../registration/RegistrationStatusEnum.js";
import { MissionStatusError } from "../../domain/exceptions/mission/MissionStatusError.js";
import { MissionDateError } from "../../domain/exceptions/mission/MissionDateError.js";
import { GeolocalizationError } from "../../domain/exceptions/mission/GeolocalizationError.js";
import { MissionFullError } from "../../domain/exceptions/mission/MissionFullError.js";
import { VolunteerRegisterAlreadyExistError } from "../../domain/exceptions/mission/VolunteerRegisterAlreadyExistError.js";
import { MissionNotActiveError } from "../../domain/exceptions/mission/MissionNotActiveError.js";
import { RegistrationNotFoundError } from "../../domain/exceptions/registration/RegistrationNotFoundError.js";
import { RegistrationStatusError } from "../../domain/exceptions/registration/RegistrationStatusError.js";
import { MissionNotFoundError } from "../../domain/exceptions/mission/MissionNotFoundError.js";
import type { IOrganizer } from "../user/IOrganizer.js";

export class Mission {
  private uuid: string;
  private name: string;
  private description: string | null;
  private dateStart: Date;
  private dateEnd: Date;
  private address: string;
  private nbrVolunteerNeeded: number;
  private createdAt: Date;
  private updatedAt: Date | null;
  private deletedAt: Date | null;
  private organizers: IOrganizer[];
  private cityId: number;
  private categoryIds: number[];
  private status: MissionStatus;
  private registrations: Registration[];

  private constructor(param: IMission) {
    this.uuid = param.uuid;
    this.name = param.name;
    this.description = param.description || null;
    this.dateStart = param.dateStart;
    this.dateEnd = param.dateEnd;
    this.nbrVolunteerNeeded = param.nbrVolunteerNeeded;

    this.createdAt = param.createdAt || new Date();
    this.updatedAt = param.updatedAt || null;
    this.deletedAt = param.deletedAt || null;

    this.address = param.address;
    this.cityId = param.cityId;

    this.status = param.status || MissionStatus.DRAFT;

    this.categoryIds = param.categoryIds || [];
    this.organizers = param.organizers;

    this.registrations = param.registrations || [];
  }

  public static create(param: IMission): Mission {
    Mission.validateBasicInfo(param);
    Mission.validateLocalisation(param);
    Mission.validateDateCoherence(param);
    Mission.validateOrganizerValid(param);
    Mission.validateCategoryValid(param);
    return new Mission(param);
  }

  public static hydrate(param: IMission): Mission {
    return new Mission(param);
  }

  private static validateBasicInfo(param: IMission): void {
    if (!param.uuid) throw new MissionStatusError("Uuid obligatoire.");
    if (!param.name || param.name.trim() === "")
      throw new MissionStatusError("Nom de la mission obligatoire.");
    if (!param.description || param.description.trim() === "")
      throw new MissionStatusError("Description de la mission obligatoire.");
    if (param.nbrVolunteerNeeded <= 0)
      throw new MissionStatusError(
        "Nombre de participants obligatoire et supérieur à 0.",
      );
  }

  private static validateLocalisation(param: IMission): void {
    if (!param.address || param.address.trim() === "")
      throw new GeolocalizationError("Adresse obligatoire.");
    if (!param.cityId) throw new GeolocalizationError("Ville obligatoire.");
  }

  private static validateDateCoherence(param: IMission): void {
    const now = new Date();
    const dateStart = param.dateStart;
    const dateEnd = param.dateEnd;

    if (!dateStart || !dateEnd) throw new MissionDateError("Date obligatoire.");
    if (dateStart.getTime() < now.getTime())
      throw new MissionDateError("Date de début doit être dans le futur.");
    if (dateStart.getTime() >= dateEnd.getTime())
      throw new MissionDateError(
        "Date de début doit être antérieure à la date de fin.",
      );
  }
  private static validateOrganizerValid(param: IMission): void {
    if (!param.organizers || param.organizers.length === 0)
      throw new MissionStatusError("Organisateur obligatoire.");

    const mainOrganizerCount = param.organizers.filter(
      (organizer) => organizer.isMain,
    ).length;

    if (mainOrganizerCount !== 1)
      throw new MissionStatusError(
        "Il doit y avoir un seul organisateur principal.",
      );

  const organizerUuids = param.organizers.map(
        (organizer) => organizer.organizerUuid,
      );
    const uniqueUuids = new Set(organizerUuids);
    if (uniqueUuids.size !== organizerUuids.length)
      throw new MissionStatusError("Les organisateurs doivent être uniques.");
  }
  private static validateCategoryValid(param: IMission): void {
    if (!param.categoryIds || param.categoryIds.length === 0)
      throw new MissionStatusError("Catégorie obligatoire.");
  }

  public toSummary() {
    return {
      uuid: this.uuid,
      name: this.name,
      dateStart: this.dateStart,
      dateEnd: this.dateEnd,
      address: this.address,
      nbrVolunteerNeeded: this.nbrVolunteerNeeded,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      cityId: this.cityId,
      categories: this.categoryIds,
      remainingPlaces: this.getAvailablePlacesCount(),
      status: this.status,
    };
  }

  public toDetail() {
    return {
      uuid: this.uuid,
      name: this.name,
      dateStart: this.dateStart,
      dateEnd: this.dateEnd,
      address: this.address,
      nbrVolunteerNeeded: this.nbrVolunteerNeeded,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      cityId: this.cityId,
      categories: this.categoryIds,
      remainingPlaces: this.getAvailablePlacesCount(),
      status: this.status,
      organizers: this.organizers,
      registrations: this.registrations.map((registration) =>
        registration.toResponse(),
      ),
    };
  }

  public publish(): void {
    if (this.deletedAt !== null) {
      throw new MissionStatusError(
        "Impossible de publier une mission supprimée.",
      );
    }

    if (this.status !== MissionStatus.DRAFT) {
      throw new MissionStatusError(
        "Impossible de publier une mission qui n'est pas en brouillon.",
      );
    }

    if (!this.name || this.name.trim() === "") {
      throw new MissionStatusError(
        "Impossible de publier une mission sans nom.",
      );
    }
    const now = new Date();
    if (!this.dateStart || !this.dateEnd || now >= this.dateStart)
      throw new MissionDateError(
        "Impossible de publier une mission sans date ou avec une date de début déjà passée.",
      );
    if (!this.description || this.description.trim() === "")
      throw new MissionStatusError(
        "Impossible de publier une mission sans description.",
      );

    if (this.organizers.length === 0) {
      throw new MissionStatusError(
        "Impossible de publier une mission sans organisateurs.",
      );
    }

    if (!this.hasAvailablePlaces() || this.nbrVolunteerNeeded === 0) {
      throw new MissionStatusError(
        "Impossible de publier une mission sans places libres.",
      );
    }

    if (!this.cityId || !this.address) {
      throw new GeolocalizationError("La mission doit avoir une localisation.");
    }

    this.status = MissionStatus.PUBLISHED;
    this.updatedAt = new Date();
  }

  public cancel(): void {
    if (this.deletedAt !== null) {
      throw new MissionStatusError(
        "Impossible d'annuler une mission supprimée.",
      );
    }
    if (this.status !== MissionStatus.PUBLISHED) {
      throw new MissionStatusError(
        "Impossible d'annuler une mission qui n'est pas en publiée.",
      );
    }

    if (this.registrations.length > 0) {
      this.registrations.forEach((registration) => {
        registration.cancel();
      });
    }

    this.status = MissionStatus.CANCELED;
    this.updatedAt = new Date();
  }

  // MARK OF SOFT DELETE FOR BACKOFFICE
  public delete(): void {
    if (this.registrations.length > 0) {
      // NO THROW ERROR IN PROD WE WANT TO COMMUNICATE WITH USER REGISTERED
      throw new MissionStatusError(
        "Impossible de supprimer une mission qui a des inscription en cours.",
      );
    }
    if (this.deletedAt !== null) return;

    this.deletedAt = new Date();
    this.status = MissionStatus.CANCELED;

    this.updatedAt = new Date();
  }

  public finish(presentUuids: string[]): void {
    if (this.deletedAt !== null) {
      throw new MissionStatusError(
        "Impossible de terminer une mission qui a été supprimée.",
      );
    }
    if (this.status === MissionStatus.DRAFT) {
      throw new MissionStatusError(
        "Impossible de terminer une mission qui est en brouillon.",
      );
    }
    if (this.status === MissionStatus.CANCELED) {
      throw new MissionStatusError(
        "Impossible de terminer une mission qui a été annulée.",
      );
    }
    if (this.status === MissionStatus.FINISHED) {
      return;
    }

    if (this.registrations.length === 0)
      throw new MissionStatusError(
        "Impossible de terminer une mission sans inscription.",
      );

    for (const registration of this.registrations) {
      if (registration.getStatus() === RegistrationStatus.VALIDATED) {
        if (presentUuids.includes(registration.getVolunteerUuid())) {
          registration.setPresent();
        } else {
          registration.setAbsent();
        }
      } else if (registration.getStatus() === RegistrationStatus.ONHOLD) {
        registration.cancel();
      }
    }

    this.status = MissionStatus.FINISHED;
    this.updatedAt = new Date();
  }

  public addRegistration(registration: Registration): void {
    if (this.deletedAt !== null) {
      throw new MissionStatusError(
        "Impossible d'interagir avec une mission supprimée.",
      );
    }
    if (this.status !== MissionStatus.PUBLISHED) {
      throw new MissionStatusError(
        "Impossible d'ajouter une inscription à une mission qui n'est pas publiée.",
      );
    }
    if (!this.hasAvailablePlaces()) {
      throw new MissionFullError(
        "Impossible d'ajouter une inscription à une mission qui est pleine.",
      );
    }

    if (registration.getStatus() !== RegistrationStatus.ONHOLD)
      throw new RegistrationStatusError(
        "Impossible d'ajouter une inscription qui n'est pas en attente.",
      );

    if (registration.getMissionUuid() !== this.uuid) {
      throw new MissionNotFoundError();
    }
    if (!this.isRegistrationOpen()) {
      throw new MissionNotActiveError();
    }
    this.executeRegistration(registration);
    this.updatedAt = new Date();
  }

  public removeRegistration(targetUuid: string): void {
    const registrationIndex = this.registrations.findIndex(
      (registration) => registration.getVolunteerUuid() === targetUuid,
    );
    if (this.deletedAt !== null) {
      throw new MissionStatusError(
        "Impossible de supprimer une inscription à une mission qui a été supprimée.",
      );
    }
    if (registrationIndex === -1) {
      throw new RegistrationNotFoundError();
    }
    this.registrations.splice(registrationIndex, 1);

    this.updatedAt = new Date();
  }

  public cancelRegistration(targetUuid: string): void {
    const registrationIndex = this.registrations.findIndex(
      (registration) => registration.getVolunteerUuid() === targetUuid,
    );
    if (this.deletedAt !== null) {
      throw new MissionStatusError(
        "Impossible d'annuler une inscription à une mission qui a été supprimée.",
      );
    }
    if (this.status !== MissionStatus.PUBLISHED) {
      throw new MissionStatusError(
        "Impossible d'annuler une inscription à une mission qui n'est pas publiée.",
      );
    }

    if (registrationIndex === -1) {
      throw new RegistrationNotFoundError();
    }
    const targetRegistration = this.registrations[
      registrationIndex
    ] as Registration;

    targetRegistration.cancel();

    this.updatedAt = new Date();
  }

  public validateRegistration(targetUuid: string): void {
    if (this.deletedAt !== null) {
      throw new MissionStatusError(
        "Impossible de valider une inscription à une mission qui a été supprimée.",
      );
    }
    if (this.status !== MissionStatus.PUBLISHED) {
      throw new MissionStatusError(
        "Impossible de valider une inscription à une mission qui n'est pas publiée.",
      );
    }
    const registration = this.registrations.find(
      (registration) => registration.getVolunteerUuid() === targetUuid,
    );

    if (!registration) {
      throw new RegistrationNotFoundError();
    }

    registration.validate();
    this.updatedAt = new Date();
  }

  public refuseRegistration(targetUuid: string): void {
    const registrationIndex = this.registrations.findIndex(
      (registration) => registration.getVolunteerUuid() === targetUuid,
    );
    if (this.deletedAt !== null) {
      throw new MissionStatusError(
        "Impossible de refuser une inscription à une mission qui a été supprimée.",
      );
    }
    if (this.status !== MissionStatus.PUBLISHED) {
      throw new MissionStatusError(
        "Impossible de refuser une inscription à une mission qui n'est pas publiée.",
      );
    }
    if (registrationIndex === -1) {
      throw new RegistrationNotFoundError();
    }
    const targetRegistration = this.registrations[
      registrationIndex
    ] as Registration;

    targetRegistration.refuse();

    this.updatedAt = new Date();
  }

  public executeRegistration(registration: Registration): void {
    const registrationIndex = this.registrations.findIndex(
      (r) => r.getVolunteerUuid() === registration.getVolunteerUuid(),
    );
    if (registrationIndex !== -1) {
      throw new VolunteerRegisterAlreadyExistError(
        registration.getVolunteerUuid(),
      );
    }
    this.registrations.push(registration);
  }

  public updateDetail(name: string, description: string) {}

  public changeDate(dateStart: Date, dateEnd: Date): void {}

  public changeLocalisation(address: string, cityId: number): void {}

  public changeCapacity(nbrVolunteerNeeded: number) {}

  public changeOrganizer(organizerUuids: string[]) {}

  public changeCategory(categoryIds: number[]) {}

  public getAvailablePlacesCount(): number {
    const validRegistration = this.registrations.filter(
      (registration) =>
        registration.getStatus() === RegistrationStatus.VALIDATED ||
        registration.getStatus() === RegistrationStatus.ONHOLD,
    );
    return Math.max(0, this.nbrVolunteerNeeded - validRegistration.length);
  }

  public hasAvailablePlaces(): boolean {
    return this.getAvailablePlacesCount() > 0;
  }

  public isRegistrationOpen(): boolean {
    const now = new Date();

    return (
      this.status === MissionStatus.PUBLISHED &&
      now >= this.dateStart &&
      now <= this.dateEnd
    );
  }

  public getUuid(): string {
    return this.uuid;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string | null {
    return this.description;
  }

  public getDateStart(): Date {
    return this.dateStart;
  }

  public getDateEnd(): Date {
    return this.dateEnd;
  }

  public getAddress(): string {
    return this.address;
  }

  public getNbrVolunteerNeeded(): number {
    return this.nbrVolunteerNeeded;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date | null {
    return this.updatedAt;
  }

  public getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  public getCityId(): number {
    return this.cityId;
  }

  public getCategoryIds(): number[] {
    return this.categoryIds;
  }

  public getStatus(): MissionStatus {
    return this.status;
  }

  public getRegistrations(): Registration[] {
    return this.registrations;
  }

  public getOrganizers(): IOrganizer[] {
    return this.organizers;
  }
}
