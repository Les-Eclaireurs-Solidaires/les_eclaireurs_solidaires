import { MissionStatus } from "./MissionStatusEnum.js";
import type { IMission } from "./IMissionModel.js";
import { Registration } from "../../registration/RegistrationModel.js";
import { RegistrationStatus } from "../../registration/RegistrationStatusEnum.js";
import { MissionStatusError } from "../exceptions/mission/MissionStatusError.js";
import { MissionFullError } from "../exceptions/mission/MissionFullError.js";
import { VolunteerRegisterAlreadyExistError } from "../exceptions/mission/VolunteerRegisterAlreadyExistError.js";
import { MissionNotActiveError } from "../exceptions/mission/MissionNotActiveError.js";
import { RegistrationNotFoundError } from "../exceptions/registration/RegistrationNotFoundError.js";
import { RegistrationStatusError } from "../exceptions/registration/RegistrationStatusError.js";
import { MissionNotFoundError } from "../exceptions/mission/MissionNotFoundError.js";
import type { IOrganizer } from "../../user/IOrganizer.js";
import type { MissionState } from "../modules/mission/MissionState.js";
import { DraftState } from "../../domain/modules/mission/DraftState.js";
import { PublishedState } from "../../domain/modules/mission/PublishedState.js";
import { CancelledState } from "../../domain/modules/mission/CancelledState.js";
import { FinishedState } from "../../domain/modules/mission/FinishedState.js";

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
  private state: MissionState = new DraftState();

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
    this.initStateFromStatus(this.status);

    this.categoryIds = param.categoryIds || [];
    this.organizers = param.organizers;

    this.registrations = param.registrations || [];

    this.state.validate(this);
  }

  public static create(param: IMission): Mission {
    return new Mission({
      ...param,
      status: MissionStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null,
      registrations: param.registrations || [],
    });
  }

  public static hydrate(param: IMission): Mission {
    return new Mission(param);
  }

  private ensureNotDeleted() {
    if (this.deletedAt !== null) {
      throw new MissionStatusError(
        "Impossible d'interagir avec une mission supprimée.",
      );
    }
  }

  public publish(): void {
    this.ensureNotDeleted();
    this.state.publish(this);
    this.updatedAt = new Date();
  }

  public cancel(): void {
    this.ensureNotDeleted();
    this.state.cancel(this);
    if (this.registrations.length > 0) {
      this.registrations.forEach((registration) => {
        registration.cancel();
      });
    }
    this.updatedAt = new Date();
  }

  public update(data: Partial<IMission>): void {
    this.ensureNotDeleted();
    if (data.name !== undefined) this.name = data.name;
    if (data.description !== undefined) this.description = data.description;
    if (data.dateStart !== undefined) this.dateStart = data.dateStart;
    if (data.dateEnd !== undefined) this.dateEnd = data.dateEnd;
    if (data.address !== undefined) this.address = data.address;
    if (data.nbrVolunteerNeeded !== undefined)
      this.nbrVolunteerNeeded = data.nbrVolunteerNeeded;
    if (data.cityId !== undefined) this.cityId = data.cityId;
    if (data.categoryIds !== undefined) this.categoryIds = data.categoryIds;

    this.state.update(this);
    this.updatedAt = new Date();
  }

  // MARK OF SOFT DELETE FOR BACKOFFICE
  public delete(): void {
    this.state.delete(this);

    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  public finish(presentUuids: string[]): void {
    this.ensureNotDeleted();
    this.state.finished(this);
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
    this.updatedAt = new Date();
  }

  public addRegistration(registration: Registration): void {
    this.ensureNotDeleted();
    this.state.addRegistration(this, registration);
    this.updatedAt = new Date();
  }

  public removeRegistration(targetUuid: string): void {
    this.ensureNotDeleted();
    const registrationIndex = this.registrations.findIndex(
      (registration) => registration.getVolunteerUuid() === targetUuid,
    );
    if (registrationIndex === -1) {
      throw new RegistrationNotFoundError();
    }
    this.state.removeRegistration(this);
    this.registrations.splice(registrationIndex, 1);
    this.updatedAt = new Date();
  }

  public cancelRegistration(targetUuid: string): void {
    this.ensureNotDeleted();
    const registrationIndex = this.registrations.findIndex(
      (registration) => registration.getVolunteerUuid() === targetUuid,
    );
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
    this.ensureNotDeleted();

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
    this.ensureNotDeleted();
    const registrationIndex = this.registrations.findIndex(
      (registration) => registration.getVolunteerUuid() === targetUuid,
    );

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
      (row) => row.getVolunteerUuid() === registration.getVolunteerUuid(),
    );
    if (registrationIndex !== -1) {
      throw new VolunteerRegisterAlreadyExistError(
        registration.getVolunteerUuid(),
      );
    }
    this.registrations.push(registration);
  }

  private initStateFromStatus(status: MissionStatus) {
    switch (status) {
      case MissionStatus.PUBLISHED:
        this.state = new PublishedState();
        break;
      case MissionStatus.CANCELED:
        this.state = new CancelledState();
        break;
      case MissionStatus.FINISHED:
        this.state = new FinishedState();
        break;
      case MissionStatus.DRAFT:
      default:
        this.state = new DraftState();
        break;
    }
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

  public getState(): MissionState {
    return this.state;
  }

  public setState(state: MissionState) {
    this.state = state;
  }

  public setStatus(status: MissionStatus) {
    this.status = status;
  }
}
