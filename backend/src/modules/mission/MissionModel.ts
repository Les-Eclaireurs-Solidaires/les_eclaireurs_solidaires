import { MissionStatus } from "./MissionStatusEnum.js";
import type { IMission } from "./IMissionModel.js";
import { Registration } from "../registration/RegistrationModel.js";
import { RegistrationStatus } from "../registration/RegistrationStatusEnum.js";
import { MissionStatusError } from "../../domain/exceptions/mission/MissionStatusError.js";
import { MissionDateError } from "../../domain/exceptions/mission/MissionDateError.js";
import { OrganizerRegisterError } from "../../domain/exceptions/mission/OrganizerRegisterError.js";
import { VolunteerRegisterAlreadyExistError } from "../../domain/exceptions/mission/VolunteerRegisterAlreadyExistError.js";
import { MissionVolunteerNotRegisteredError } from "../../domain/exceptions/mission/MissionVolunteerNotRegisterError.js";

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
  private organizerUuid: string[];
  private cityId: number;
  private status: MissionStatus;
  private registrations: Registration[];
  private remainingPlacesFromRepo?: number | undefined;
  private isFull: boolean;

  constructor(param: IMission) {
    this.uuid = param.uuid;
    this.name = param.name;
    this.description = param.description || null;
    this.dateStart = param.dateStart;
    this.dateEnd = param.dateEnd;
    this.address = param.address;
    this.nbrVolunteerNeeded = param.nbrVolunteerNeeded;
    this.createdAt = param.createdAt || new Date();
    this.updatedAt = param.updatedAt || null;
    this.deletedAt = param.deletedAt || null;

    this.organizerUuid = param.organizerUuids;

    this.cityId = param.cityId;
    this.status = param.status || MissionStatus.PUBLIEE;
    this.registrations = param.registrations || [];

    this.remainingPlacesFromRepo = param.remainingPlaces || undefined;
    this.isFull = param.isFull || false;

    this.validateDate();
  }

  public toResponse() {
    return {
      uuid: this.uuid,
      name: this.name,
      description: this.description,
      dateStart: this.dateStart,
      dateEnd: this.dateEnd,
      address: this.address,
      nbrVolunteerNeeded: this.nbrVolunteerNeeded,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      cityId: this.cityId,
      status: this.status,
      organizerUuid: this.organizerUuid,
      remainingPlaces: this.getAvailablePlacesCount(),
      isFull: !this.hasAvailablePlaces(),
    };
  }

  private validateDate(): void {
    if (this.dateStart > this.dateEnd) {
      throw new MissionDateError(
        "La date de début doit être antérieure à la date de fin.",
      );
    }
  }

  public getAvailablePlacesCount(): number {
    if (this.remainingPlacesFromRepo !== undefined) {
      return Math.max(0,this.remainingPlacesFromRepo);
    }

    if (this.isFull) {
      return 0;
    }

    const validRegistration = this.registrations.filter(
      (registration) =>
        registration.getStatus() === RegistrationStatus.VALIDEE ||
        registration.getStatus() === RegistrationStatus.EN_ATTENTE,
    );
    return Math.max(0, this.nbrVolunteerNeeded - validRegistration.length);
  }

  public hasAvailablePlaces(): boolean {
    return this.getAvailablePlacesCount() > 0;
  }

  public cancel(): void {
    if (
      this.status === MissionStatus.TERMINEE ||
      this.status === MissionStatus.ANNULEE ||
      this.deletedAt !== null
    ) {
      throw new MissionStatusError("La mission ne peut pas être annulée.");
    }

    this.status = MissionStatus.ANNULEE;
    this.deletedAt = new Date();
    this.updatedAt = new Date();

    this.registrations.forEach((registration) => {
      registration.changeStatus(RegistrationStatus.ANNULEE);
    });
  }

  public complete(): void {
    this.status = MissionStatus.TERMINEE;
    this.updatedAt = new Date();
  }

  public addRegistration(registration: Registration): void {
    if (this.status === MissionStatus.TERMINEE) {
      throw new MissionStatusError(
        "Impossible d'inscrire à une mission terminée.",
      );
    }

    if (this.status === MissionStatus.ANNULEE) {
      throw new MissionStatusError(
        "Impossible d'inscrire à une mission annulée.",
      );
    }

    if (!this.hasAvailablePlaces()) {
      throw new MissionStatusError(
        "Impossible d'inscrire à une mission pleine.",
      );
    }

    const volunteerUuid = registration.getVolunteerUuid();

    if (this.organizerUuid.includes(volunteerUuid)) {
      throw new OrganizerRegisterError();
    }

    const isAlreadyRegistered = this.registrations.some(
      (registration) => registration.getVolunteerUuid() === volunteerUuid,
    );

    if (isAlreadyRegistered) {
      throw new VolunteerRegisterAlreadyExistError(volunteerUuid);
    }

    this.registrations.push(registration);
  }

  public removeRegistration(
    userUuid: string,
    registrationStatus: RegistrationStatus,
  ): void {
    if (this.status === MissionStatus.TERMINEE) {
      throw new MissionStatusError(
        "Impossible de se désinscrire d'une mission terminée.",
      );
    }

    if (this.status === MissionStatus.ANNULEE) {
      throw new MissionStatusError(
        "Impossible de se désinscrire d'une mission annulée.",
      );
    }

    const registration = this.registrations.find(
      (reg) => reg.getVolunteerUuid() === userUuid,
    );

    if (!registration) {
      throw new MissionVolunteerNotRegisteredError(
        "Cet utilisateur n'est pas inscrit à cette mission.",
      );
    }
    registration.changeStatus(registrationStatus);
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

  public getStatus(): MissionStatus {
    return this.status;
  }

  public getRegistrations(): Registration[] {
    return this.registrations;
  }

  public getOrganizerUuid(): string[] {
    return this.organizerUuid;
  }
}
