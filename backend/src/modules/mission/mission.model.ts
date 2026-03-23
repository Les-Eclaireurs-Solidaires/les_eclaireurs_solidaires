import { MissionStatus } from "./missionStatus.enum.js";
import type { IMission } from "./mission.interface.js";
import { regitration } from "../regitration/regitration.model.js";
import crypto from "crypto";
import { regitrationStatus } from "../regitration/regitrationStatus.enum.js";

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
  private regitrations: regitration[];

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
    this.regitrations = param.regitrations
      ? param.regitrations.map(
          (regitration) => new regitration(regitration, this.uuid),
        )
      : [];

    this.validateDate();
  }

  private validateDate(): void {
    if (this.dateStart > this.dateEnd) {
      throw new Error(
        "La date de début ne peut pas être ultérieure à la date de fin.",
      );
    }
  }

  public getAvailablePlacesCount(): number {
    const validregitrations = this.regitrations.filter(
      (i) =>
        i.getStatus() === regitrationStatus.VALIDEE ||
        i.getStatus() === regitrationStatus.EN_ATTENTE,
    );
    return this.nbrVolunteerNeeded - validregitrations.length;
  }

  public hasAvailablePlaces(): boolean {
    return this.getAvailablePlacesCount() > 0;
  }

  public cancel(): void {
    if (
      this.status === MissionStatus.TERMINEE ||
      this.status === MissionStatus.ANNULEE
    ) {
      throw new Error("La mission ne peut pas être annulée.");
    }

    this.status = MissionStatus.ANNULEE;
    this.updatedAt = new Date();

    this.regitrations.forEach((i) => {
      i.setStatus(regitrationStatus.ANNULEE);
    });
  }

  public complete(): void {
    this.status = MissionStatus.TERMINEE;
    this.updatedAt = new Date();
  }

  public delete(): void {
    if (this.deletedAt) {
      throw new Error("La mission a déjà été supprimée.");
    }
    this.deletedAt = new Date();
    this.updatedAt = new Date();
    if (
      this.status !== MissionStatus.TERMINEE &&
      this.status !== MissionStatus.ANNULEE
    ) {
      this.status = MissionStatus.ANNULEE;
      this.regitrations.forEach((i) => {
        i.setStatus(regitrationStatus.ANNULEE);
      });
    }
  }

  public addregitration(regitration: regitration): void {
    if (this.status === MissionStatus.TERMINEE) {
      throw new Error("Impossible d'inscrire à une mission terminée.");
    }

    if (this.status === MissionStatus.ANNULEE) {
      throw new Error("Impossible d'inscrire à une mission annulée.");
    }

    if (!this.hasAvailablePlaces()) {
      throw new Error("Impossible d'inscrire à une mission pleine.");
    }

    const volunteerUuid = regitration.getVolunteer().getUuid();

    if (this.organizerUuid.includes(volunteerUuid)) {
      throw new Error(
        "Impossible de s'inscrirte à une mission que l'on organise.",
      );
    }

    const isAlreadyRegistered = this.regitrations.some(
      (i) => i.getVolunteer().getUuid() === volunteerUuid,
    );

    if (isAlreadyRegistered) {
      throw new Error("Cet utilisateur est déjà inscrit à cette mission.");
    }

    this.regitrations.push(regitration);
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

  public getregitrations(): regitration[] {
    return this.regitrations;
  }
}
