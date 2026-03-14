import { MissionStatus } from "../mission_status/missionStatus.enum.js";
import type { IMission } from "./mission.interface.js";
import { Inscription } from "../inscription/inscription.model.js";
import crypto from "crypto";
import { InscriptionStatus } from "../inscription/inscriptionStatus.enum.js";

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
  private cityId: number;
  private status: MissionStatus;
  private inscriptions: Inscription[];

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

    this.cityId = param.cityId;
    this.status = param.status || MissionStatus.BROUILLON;
    this.inscriptions = param.inscriptions
      ? param.inscriptions.map(
          (inscription) => new Inscription(inscription, this),
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
    const validInscriptions = this.inscriptions.filter(
      (i) =>
        i.getStatus() === InscriptionStatus.VALIDEE ||
        i.getStatus() === InscriptionStatus.EN_ATTENTE,
    );
    return this.nbrVolunteerNeeded - validInscriptions.length;
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

    this.inscriptions.forEach((i) => {
      i.setStatus(InscriptionStatus.ANNULEE);
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
      this.inscriptions.forEach((i) => {
        i.setStatus(InscriptionStatus.ANNULEE);
      });
    }
  }
}
