import type { OrganizerParticipationDTO } from "../../presentation/dto/mission/OrganizerParticipationDTO.js";
import type { UpdateMissionDetailsDTO } from "../../presentation/dto/mission/UpdateMissionDetailsDTO.js";
import type { UpdateMissionOrganizersDTO } from "../../presentation/dto/mission/UpdateMissionOrganizersDTO.js";
import type { IDomainEvent } from "../IDomainEvent.js";
import { Registration } from "../registration/Registration.js";
import { RegistrationStatus } from "../registration/RegistrationStatusEnum.js";
import type { IActor } from "../user/IActor.js";
import type { Organizer } from "../user/Organizer.js";
import { UserRole } from "../user/UserRoleEnum.js";
import { OrganizersUpdateEvent } from "./event/OrganizersUpdateEvent.js";
import { RegistrationsUpdateEvent } from "./event/RegistrationsUpdateEvent.js";
import { MissionStatusError } from "./exceptions/MissionStatusError.js";
import { UnauthorizedMissionActionError } from "./exceptions/UnauthorizedMissionActionError.js";
import { VolunteerRegisterAlreadyExistError } from "./exceptions/VolunteerRegisterAlreadyExistError.js";
import type { MissionParam } from "./interfaces/MissionParam.js";
import type { MissionState } from "./MissionState.js";
import { MissionStatus } from "./MissionStatusEnum.js";
import { CancelledState } from "./state/CancelledState.js";
import { DraftState } from "./state/DraftState.js";
import { FinishedState } from "./state/FinishedState.js";
import { PublishedState } from "./state/PublishedState.js";

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
  private organizers: Organizer[];
  private cityId: number;
  private categoryIds: number[];
  private status: MissionStatus;
  private registrations: Registration[];
  private state: MissionState = new DraftState();
  protected missionEvents: IDomainEvent[] = [];

  private constructor(param: MissionParam) {
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
  }
  public static hydrate(param: MissionParam): Mission {
    return new Mission(param);
  }
  public addEvent(event: IDomainEvent) {
    this.missionEvents.push(event);
  }
  public getEvents(): IDomainEvent[] {
    const events = this.missionEvents;
    this.missionEvents = [];
    return events;
  }
  private ensureNotDeleted() {
    if (this.deletedAt !== null) {
      throw new MissionStatusError(
        "Impossible d'interagir avec une mission supprimée.",
      );
    }
  }
  public synchroOrgaRegistration(organizers: OrganizerParticipationDTO[]) {
    this.organizers = organizers.map((o) => ({
      organizerUuid: o.organizerUuid,
      isMain: o.isMain,
    }));

    const incomingOrganizerUuids = organizers.map((o) => o.organizerUuid);
    const realVolunteersRegs = this.registrations.filter(
      (reg) => !incomingOrganizerUuids.includes(reg.getVolunteerUuid()),
    );

    const organizerRegs: Registration[] = [];

    for (const org of organizers) {
      const existingReg = this.registrations.find(
        (r) => r.getVolunteerUuid() === org.organizerUuid,
      );

      if (org.isParticipant) {
        if (existingReg) {
          organizerRegs.push(existingReg);
        } else {
          organizerRegs.push(
            new Registration(
              {
                date: new Date(),
                volunteerUuid: org.organizerUuid,
                status: RegistrationStatus.VALIDATED,
              },
              this.uuid,
            ),
          );
        }
      } else {
        if (
          existingReg &&
          existingReg.getStatus() !== RegistrationStatus.CANCELED
        ) {
          existingReg.cancel();
          organizerRegs.push(existingReg);
        }
      }
    }
    this.registrations = [...realVolunteersRegs, ...organizerRegs];
    this.addEvent(new RegistrationsUpdateEvent(this));
  }
  public static create(
    param: MissionParam,
    organizers: OrganizerParticipationDTO[],
    actor: IActor,
  ): Mission {
    const actorIsAdmin = actor.getRole() === UserRole.SUPER_ADMIN;
    const actorIsOrganizer = organizers.find(
      (o) => o.organizerUuid === actor.getUuid(),
    );
    const actorIsCreator =
      actorIsOrganizer !== undefined &&
      actorIsOrganizer.isMain === true &&
      actor.getRole() === UserRole.ORGANIZER;
    if (!actorIsAdmin && !actorIsCreator) {
      throw new UnauthorizedMissionActionError();
    }
    const mission = new Mission({
      ...param,
      status: MissionStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null,
    });
    mission.synchroOrgaRegistration(organizers);
    return mission;
  }
  public updateDetails(dto: UpdateMissionDetailsDTO, actor: IActor): void {
    this.ensureNotDeleted();
    const isAdmin = actor.getRole() === UserRole.SUPER_ADMIN;
    const isOrganizer = this.organizers.find(
      (o) => o.organizerUuid === actor.getUuid(),
    );
    if (!isAdmin && !isOrganizer) {
      throw new UnauthorizedMissionActionError();
    }
    this.state.updateDetails(this, dto);
    if (dto.name !== undefined) this.name = dto.name;
    if (dto.description !== undefined) this.description = dto.description;
    if (dto.dateStart !== undefined) this.dateStart = new Date(dto.dateStart);
    if (dto.dateEnd !== undefined) this.dateEnd = new Date(dto.dateEnd);
    if (dto.address !== undefined) this.address = dto.address;
    if (dto.nbrVolunteerNeeded !== undefined)
      this.nbrVolunteerNeeded = dto.nbrVolunteerNeeded;
    if (dto.cityId !== undefined) this.cityId = dto.cityId;
    if (dto.categoryIds !== undefined) this.categoryIds = dto.categoryIds;
    this.state.validate(this);
    if (dto.toPublish) this.publish();
    this.updatedAt = new Date();
  }
  public updateOrganizers(
    dto: UpdateMissionOrganizersDTO,
    actor: IActor,
  ): void {
    this.ensureNotDeleted();
    const isAdmin = actor.getRole() === UserRole.SUPER_ADMIN;
    const isCreator = this.organizers.some(
      (o) => o.organizerUuid === actor.getUuid() && o.isMain === true,
    );
    if (!isAdmin && !isCreator) {
      throw new UnauthorizedMissionActionError();
    }
    this.state.updateOrganizers(this, dto);
    this.synchroOrgaRegistration(dto.organizers);
    this.updatedAt = new Date();
    this.state.validate(this);
    this.addEvent(new OrganizersUpdateEvent(this));
    this.addEvent(new RegistrationsUpdateEvent(this));
  }
  public publish(): void {
    this.ensureNotDeleted();
    this.state.publish(this);
    this.updatedAt = new Date();
    this.addEvent(new OrganizersUpdateEvent(this));
    this.addEvent(new RegistrationsUpdateEvent(this));
  }
  public cancel(): void {
    this.ensureNotDeleted();
    this.state.cancel(this);
    this.cancelRegistrations(this.registrations);
    this.addEvent(new RegistrationsUpdateEvent(this));
    this.updatedAt = new Date();
  }
  public delete(): void {
    this.state.delete(this);
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }
  public finish(presentUuids: string[]): void {
    this.ensureNotDeleted();
    this.state.finished(this);
    this.finishRegistrations(presentUuids, this.registrations);
    this.updatedAt = new Date();
    this.addEvent(new RegistrationsUpdateEvent(this));
  }
  public revertToDraft(): void {
    this.ensureNotDeleted();
    this.state.revertToDraft(this);
    this.updatedAt = new Date();
  }
  private cancelRegistrations(registrations: Registration[]): void {
    for (const registration of registrations) {
      registration.cancel();
    }
  }
  private finishRegistrations(
    presentUuids: string[],
    registrations: Registration[],
  ): void {
    for (const registration of registrations) {
      const currentStatus = registration.getStatus();

      if (currentStatus === RegistrationStatus.VALIDATED) {
        if (presentUuids.includes(registration.getVolunteerUuid())) {
          registration.setPresent();
        } else {
          registration.setAbsent();
        }
      } else if (currentStatus === RegistrationStatus.ONHOLD) {
        registration.refuse();
      }
    }
  }

  public subscribe(registration: Registration, actor: IActor): void {
    this.ensureNotDeleted();
    if (!actor.getRole()) {
      throw new MissionStatusError(
        "Vous n'avez pas les accès pour vous inscrire à la mission.",
      );
    }
    const isSuperAdmin = actor.getRole() === UserRole.SUPER_ADMIN;
    const isSelf = actor.getUuid() === registration.getVolunteerUuid();
    const isMissionOrganizer = this.organizers.some(o => o.organizerUuid === actor.getUuid());

    if (!isSuperAdmin && !isSelf && !isMissionOrganizer) {
      throw new UnauthorizedMissionActionError();
    }
    this.state.subscribe(this, registration);
    this.updatedAt = new Date();
    this.addEvent(new RegistrationsUpdateEvent(this))
  }

  /*public removeRegistration(targetUuid: string): void {
     this.ensureNotDeleted();
    const registrationIndex = this.registrations.findIndex(
      (registration) => registration.getVolunteerUuid() === targetUuid,
    );
    if (registrationIndex === -1) {
      throw new RegistrationNotFoundError();
    }
    this.state.removeRegistration(this, this.registrations[registrationIndex]);
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
*/
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
      status: this.status,
      organizers: this.organizers,
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
      status: this.status,
      organizers: this.organizers,
    };
  }
  public toDashboard() {
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
  public getOrganizers(): Organizer[] {
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
