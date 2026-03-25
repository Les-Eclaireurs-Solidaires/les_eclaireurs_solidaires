import { MissionStatus } from "./missionStatus.enum.js";
import type { IMission } from "./mission.interface.js";
import crypto from "crypto";
import { Registration } from "../registration/registration.model.js";
import { RegistrationStatus } from "../registration/registrationStatus.enum.js";
import { BusinessException } from "../../utils/AppException.js";

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

  constructor(param: IMission) {
    this.uuid = param.uuid || crypto.randomUUID();
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

    this.validateDate();
  }

  private validateDate(): void {
    if (this.dateStart > this.dateEnd) {
      throw new BusinessException(
        "La date de début ne peut pas être ultérieure à la date de fin.",
      );
    }
  }

  public getAvailablePlacesCount(): number {
    const validRegistration = this.registrations.filter(
      (registration) =>
        registration.getStatus() === RegistrationStatus.VALIDEE ||
        registration.getStatus() === RegistrationStatus.EN_ATTENTE,
    );
    return this.nbrVolunteerNeeded - validRegistration.length;
  }

  public hasAvailablePlaces(): boolean {
    return this.getAvailablePlacesCount() > 0;
  }

  public cancel(): void {
    if (
      this.status === MissionStatus.TERMINEE ||
      this.status === MissionStatus.ANNULEE
    ) {
      throw new BusinessException("La mission ne peut pas être annulée.");
    }

    this.status = MissionStatus.ANNULEE;
    this.updatedAt = new Date();

    this.registrations.forEach((registration) => {
      registration.setStatus(RegistrationStatus.ANNULEE);
    });
  }

  public complete(): void {
    this.status = MissionStatus.TERMINEE;
    this.updatedAt = new Date();
  }

  public delete(): void {
    if (this.deletedAt) {
      throw new BusinessException("La mission a déjà été supprimée.");
    }
    this.deletedAt = new Date();
    this.updatedAt = new Date();
    if (
      this.status !== MissionStatus.TERMINEE &&
      this.status !== MissionStatus.ANNULEE
    ) {
      this.status = MissionStatus.ANNULEE;
      this.registrations.forEach((registration) => {
        registration.setStatus(RegistrationStatus.ANNULEE);
      });
    }
  }

  public addRegistration(registration: Registration): void {
    if (this.status === MissionStatus.TERMINEE) {
      throw new BusinessException(
        "Impossible d'inscrire à une mission terminée.",
      );
    }

    if (this.status === MissionStatus.ANNULEE) {
      throw new BusinessException(
        "Impossible d'inscrire à une mission annulée.",
      );
    }

    if (!this.hasAvailablePlaces()) {
      throw new BusinessException(
        "Impossible d'inscrire à une mission pleine.",
      );
    }

    const volunteerUuid = registration.getVolunteerUuid();

    if (this.organizerUuid.includes(volunteerUuid)) {
      throw new BusinessException(
        "Impossible de s'inscrirte à une mission que l'on organise.",
      );
    }

    const isAlreadyRegistered = this.registrations.some(
      (registration) => registration.getVolunteerUuid() === volunteerUuid,
    );

    if (isAlreadyRegistered) {
      throw new BusinessException(
        "Cet utilisateur est déjà inscrit à cette mission.",
      );
    }

    this.registrations.push(registration);
  }

  public removeRegistration(userUuid: string,registrationStatus: RegistrationStatus): void {
    if (this.status === MissionStatus.TERMINEE) {
      throw new BusinessException(
        "Impossible de se désinscrire d'une mission terminée.",
      );
    }

    if (this.status === MissionStatus.ANNULEE) {
      throw new BusinessException(
        "Impossible de se désinscrire d'une mission annulée.",
      );
    }

    const registration = this.registrations.find(
      (reg) => reg.getVolunteerUuid() === userUuid,
    );

    if (!registration) {
      throw new BusinessException(
        "Cet utilisateur n'est pas inscrit à cette mission.",
      );
    }
    registration.setStatus(registrationStatus);
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
