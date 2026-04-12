import {
  GeolocalizationError,
  MissionDateError,
  MissionStatusError,
} from '../../../core/exceptions/missions-error.error';
import { Registration, RegistrationStatus } from '../../registration/registration.model';
import { MissionDTO, Organizer } from '../interfaces/MissionDTO';
import { MissionFromApi, MissionStatus } from '../mission-response.interface';

export class MissionModel {
  private uuid?: string;
  private name: string;
  private description?: string;
  private dateStart?: Date;
  private dateEnd?: Date;
  private address?: string;
  private nbrVolunteerNeeded?: number;
  private createdAt?: Date;
  private updatedAt?: Date;
  private deletedAt?: Date;
  private organizers?: Organizer[];
  private cityId?: number;
  private categoryIds?: number[];
  private status?: MissionStatus;
  private registrations: Registration[];

  private constructor() {
    this.name = '';
    this.organizers = [];
    this.registrations = [];
    this.categoryIds = [];
  }
  public static createFromApi(mission: MissionFromApi): MissionModel {
    const missionModel = new MissionModel();
    missionModel.uuid = mission.uuid;
    missionModel.name = mission.name;
    missionModel.description = mission.description ?? undefined;
    missionModel.dateStart = mission.dateStart;
    missionModel.dateEnd = mission.dateEnd;
    missionModel.address = mission.address;
    missionModel.nbrVolunteerNeeded = mission.nbrVolunteerNeeded;
    missionModel.createdAt = mission.createdAt;
    missionModel.updatedAt = mission.updatedAt ?? undefined;
    missionModel.deletedAt = mission.deletedAt ?? undefined;
    missionModel.organizers = mission.organizers;
    missionModel.categoryIds = mission.categories;
    missionModel.cityId = mission.cityId;
    missionModel.status = mission.status;
    missionModel.registrations = mission.registrations !== undefined ? mission.registrations : [];

    return missionModel;
  }
  public static createDraftFromForm(formData: MissionDTO, creatorUuid: string): MissionModel {
    const missionModel = new MissionModel();
    missionModel.name = formData.name;
    missionModel.description = formData.description ?? undefined;
    missionModel.dateStart = formData.dateStart ? new Date(formData.dateStart) : undefined;
    missionModel.dateEnd = formData.dateEnd ? new Date(formData.dateEnd) : undefined;
    missionModel.address = formData.address ?? undefined;
    missionModel.nbrVolunteerNeeded = formData.nbrVolunteerNeeded ?? undefined;
    missionModel.cityId = formData.cityId ?? undefined;
    missionModel.categoryIds = formData.categoryIds ?? [];
    missionModel.organizers = [{ organizerUuid: creatorUuid, isMain: true }];


    missionModel.status = MissionStatus.DRAFT;
    missionModel.validateDraftInvariant();
    return missionModel;
  }
  public static createPublishMission(formData: MissionDTO, creatorUuid: string): MissionModel {
    const missionModel = new MissionModel();
    missionModel.name = formData.name;
    missionModel.description = formData.description ?? undefined;
    missionModel.dateStart = formData.dateStart ? new Date(formData.dateStart) : undefined;
    missionModel.dateEnd = formData.dateEnd ? new Date(formData.dateEnd) : undefined;
    missionModel.address = formData.address ?? undefined;
    missionModel.nbrVolunteerNeeded = formData.nbrVolunteerNeeded ?? undefined;
    missionModel.cityId = formData.cityId ?? undefined;
    missionModel.categoryIds = formData.categoryIds ?? [];
    missionModel.organizers = [{ organizerUuid: creatorUuid, isMain: true }];

    missionModel.status = MissionStatus.PUBLISHED;
    missionModel.validatePublishInvariant();
    return missionModel;
  }
  public toDTO(): MissionDTO {
    const isPublishing = this.status === MissionStatus.PUBLISHED;
    const dto: Partial<MissionDTO> = {
      toPublish: isPublishing,
      name: this.name,
    };
    if (this.description) dto.description = this.description;
    if (this.dateStart) dto.dateStart = this.dateStart.toISOString();
    if (this.dateEnd) dto.dateEnd = this.dateEnd.toISOString();
    if (this.address) dto.address = this.address;
    if (this.nbrVolunteerNeeded && this.nbrVolunteerNeeded > 0)
      dto.nbrVolunteerNeeded = this.nbrVolunteerNeeded;
    if (this.cityId && this.cityId > 0) dto.cityId = this.cityId;
    if (this.categoryIds && this.categoryIds.length > 0) dto.categoryIds = this.categoryIds;
    if(this.organizers && this.organizers.length > 0) dto.organizers = this.organizers;
    return dto as MissionDTO;
  }
  protected validateDraftInvariant(): void {
    this.validateRealityInvariant();
    this.validateBusinessInvariant();
  }
  protected validatePublishInvariant(): void {
    this.validateRealityInvariant();
    this.validateBusinessInvariant();
    const limitDate = new Date();
    const dateStart = this.getDateStart();
    limitDate.setDate(limitDate.getDate() + 1);
    if (dateStart && dateStart.getTime() < limitDate.getTime()) {
      throw new MissionDateError('La date de début doit commencer au moins dans 1 jour.');
    }
    this.validateBasicInfo();
    this.validateLocalisation();
    this.validateDateCoherence();
    this.validateCategoryValid();
    const nbreVolunteerNeeded = this.getNbrVolunteerNeeded();
    if (!nbreVolunteerNeeded || nbreVolunteerNeeded <= 0) {
      throw new MissionStatusError('Une mission publiée doit demander au moins un bénévole.');
    }
  }
  protected validateRealityInvariant(): void {
    const nbreVolunteerNeeded = this.getNbrVolunteerNeeded();
    if (
      nbreVolunteerNeeded !== undefined &&
      nbreVolunteerNeeded !== null &&
      nbreVolunteerNeeded < 0
    ) {
      throw new MissionStatusError('Le nombre de bénévoles ne peut pas être négatif.');
    }
    const address = this.getAddress();
    if (address && address.length > 255) {
      throw new GeolocalizationError("L'adresse ne peut pas dépasser 255 caractères.");
    }
    const startDate = this.getDateStart();
    const endDate = this.getDateEnd();
    if (startDate && endDate && startDate.getTime() >= endDate.getTime()) {
      throw new MissionDateError('La date de fin doit être après la date de début.');
    }
  }
  protected validateBusinessInvariant(): void {
    if (!this.getName() || this.getName().trim() === '') {
      throw new MissionStatusError('Une mission doit au moins avoir un nom.');
    }
  }
  protected validateBasicInfo(): void {
    if (!this.getDescription() || this.getDescription()?.trim() === '')
      throw new MissionStatusError('Description de la mission obligatoire.');
  }
  protected validateLocalisation(): void {
    if (!this.getCityId()) throw new GeolocalizationError('Ville obligatoire pour publier.');

    const address = this.getAddress();
    if (!address || address.trim() === '') {
      throw new GeolocalizationError("L'adresse de la mission est obligatoire pour publier.");
    }
  }
  protected validateDateCoherence(): void {
    const now = new Date();
    const dateStart = this.getDateStart();
    const dateEnd = this.getDateEnd();
    if (!dateStart || !dateEnd) throw new MissionDateError('Date obligatoire.');
    if (dateStart.getTime() < now.getTime())
      throw new MissionDateError('Date de début doit être dans le futur.');
  }
  protected validateCategoryValid(): void {
    if (!this.getCategoryIds() || this.getCategoryIds()?.length === 0)
      throw new MissionStatusError('Catégorie obligatoire.');
  }
  protected isRegistrationOpen(): boolean {
    const now = new Date();
    const startDate = this.getDateStart();
    const endDate = this.getDateEnd();
    if (!startDate || !endDate) return false;
    return this.getStatus() === MissionStatus.PUBLISHED && now >= startDate && now <= endDate;
  }
  protected getAvailablePlacesCount(): number {
    const validRegistration = this.getRegistrations().filter(
      (registration) =>
        registration.getStatus() === RegistrationStatus.VALIDATED ||
        registration.getStatus() === RegistrationStatus.ONHOLD,
    );
    const nbrVolunteerNeeded = this.getNbrVolunteerNeeded() || 0;

    return Math.max(0, nbrVolunteerNeeded - validRegistration.length);
  }
  protected hasAvailablePlaces(): boolean {
    return this.getAvailablePlacesCount() > 0;
  }
  getStatusLabel(): string {
    switch (this.status) {
      case MissionStatus.DRAFT:
      default:
        return 'Brouillon';
      case MissionStatus.PUBLISHED:
        return 'Publié - En Cours';
      case MissionStatus.CANCELED:
        return 'Annulé';
      case MissionStatus.FINISHED:
        return 'Terminé';
    }
  }
  getUuid(): string | undefined {
    return this.uuid;
  }
  getName(): string {
    return this.name;
  }
  getDescription(): string | undefined {
    return this.description;
  }
  getDateStart(): Date | undefined {
    return this.dateStart;
  }
  getDateEnd(): Date | undefined {
    return this.dateEnd;
  }
  getAddress(): string | undefined {
    return this.address;
  }
  getNbrVolunteerNeeded(): number | undefined {
    return this.nbrVolunteerNeeded;
  }
  getCreatedAt(): Date | undefined {
    return this.createdAt;
  }
  getUpdatedAt(): Date | undefined {
    return this.updatedAt;
  }
  getDeletedAt(): Date | undefined {
    return this.deletedAt;
  }
  getOrganizers(): Organizer[] | undefined {
    return this.organizers;
  }
  getCityId(): number | undefined {
    return this.cityId;
  }
  getStatus(): MissionStatus | undefined {
    return this.status;
  }
  getRegistrations(): Registration[] {
    return this.registrations;
  }
  getCategoryIds(): number[] | undefined {
    return this.categoryIds;
  }
}
