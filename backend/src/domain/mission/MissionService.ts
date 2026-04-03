import { MissionNameAlreadyExistError } from "../exceptions/mission/MissionNameAlreadyExistError.js";
import { Mission } from "./Mission.js";
import crypto from "crypto";
import type { IMissionRepository } from "./IMissionRepository.js";
import type { IMissionService } from "./IMissionService.js";
import { MissionStatus } from "./MissionStatusEnum.js";
import type { UpdateMissionDTO } from "./dtos/UpdateMissionDTO.js";
import { RegistrationStatus } from "../registration/RegistrationStatusEnum.js";
import { Registration } from "../registration/RegistrationModel.js";
import type { SearchMissionDTO } from "./dtos/SearchMissionDTO.js";
import type { CreateMissionDTO } from "./dtos/CreateMissionDTO.js";
import type { Pool, PoolConnection } from "mysql2/promise";
import { MissionNotFoundError } from "../exceptions/mission/MissionNotFoundError.js";
import type { IRegistrationRepository } from "../registration/IRegistrationRepository.js";
import type { IOrganizer } from "../user/IOrganizer.js";
import { UserNotFoundError } from "../exceptions/auth/UserNotFoundError.js";
import type { IUserRepository } from "../user/IUserRepository.js";
import type { IMission } from "./IMissionModel.js";

export class MissionService implements IMissionService {
  constructor(
    private missionRepository: IMissionRepository,
    private registrationRepository: IRegistrationRepository,
    private userRepository: IUserRepository,
    private db: Pool,
  ) {}

  async createMission(missionDTO: CreateMissionDTO): Promise<Mission> {
    const connection: PoolConnection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      const existingMission = await this.missionRepository.findByName(
        missionDTO.name,
        connection,
        true,
      );

      if (existingMission) {
        throw new MissionNameAlreadyExistError(
          `La mission : ${missionDTO.name} existe déjà.`,
        );
      }

      const uuid: string = crypto.randomUUID();
      for (const organizer of missionDTO.organizers) {
        const user = await this.userRepository.findByUuid(
          organizer.organizerUuid,
          connection,
        );
        if (!user) {
          throw new UserNotFoundError();
        }
      }
      const organizerList: IOrganizer[] = missionDTO.organizers.map(
        (organizer) => {
          return {
            organizerUuid: organizer.organizerUuid,
            isMain: organizer.isMain || false,
          };
        },
      );
      const registrationsOrganizer = missionDTO.organizers
        .filter((organizer) => organizer.isParticipant)
        .map((organizer) => {
          return new Registration(
            {
              date: new Date(),
              volunteerUuid: organizer.organizerUuid,
              status: RegistrationStatus.VALIDATED,
            },
            uuid,
          );
        });

      const mission: Mission = Mission.create({
        uuid: uuid,
        name: missionDTO.name,
        description: missionDTO.description || null,
        dateStart: new Date(missionDTO.dateStart as string),
        dateEnd: new Date(missionDTO.dateEnd as string),
        createdAt: new Date(),
        address: missionDTO.address || "",
        nbrVolunteerNeeded: missionDTO.nbrVolunteerNeeded || 0,
        cityId: missionDTO.cityId || 0,
        organizers: organizerList,
        categoryIds: missionDTO.categoryIds || [],
        registrations: registrationsOrganizer,
        status: MissionStatus.DRAFT,
      });

      if (missionDTO.toPublish) mission.publish();

      const result = await this.missionRepository.create(mission, connection);

      for (const registration of mission.getRegistrations()) {
        await this.registrationRepository.saveRegistration(
          registration,
          result.getUuid(),
          connection,
        );
      }

      await connection.commit();

      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateMission(
    missionDTO: UpdateMissionDTO,
    uuid: string,
  ): Promise<Mission> {
    const connection: PoolConnection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      // --- ACTE 1 : L'HYDRATATION ---
      const mission = await this.missionRepository.findByUuid(uuid, connection);
      if (!mission) {
        throw new MissionNotFoundError();
      }

      // (Optionnel mais recommandé) Si le DTO contient un nouveau nom, on vérifie qu'il n'est pas déjà pris
      if (missionDTO.name && missionDTO.name !== mission.getName()) {
        const existingMission = await this.missionRepository.findByName(
          missionDTO.name,
          connection,
          true,
        );
        if (existingMission) {
          throw new MissionNameAlreadyExistError(
            `La mission : ${missionDTO.name} existe déjà.`,
          );
        }
      }

      const updateData: Partial<IMission> = {};

      if (missionDTO.name !== undefined) updateData.name = missionDTO.name;
      if (missionDTO.description !== undefined)
        updateData.description = missionDTO.description;
      if (missionDTO.dateStart !== undefined)
        updateData.dateStart = new Date(missionDTO.dateStart);
      if (missionDTO.dateEnd !== undefined)
        updateData.dateEnd = new Date(missionDTO.dateEnd);
      if (missionDTO.address !== undefined)
        updateData.address = missionDTO.address;
      if (missionDTO.nbrVolunteerNeeded !== undefined)
        updateData.nbrVolunteerNeeded = missionDTO.nbrVolunteerNeeded;
      if (missionDTO.cityId !== undefined)
        updateData.cityId = missionDTO.cityId;
      if (missionDTO.categoryIds !== undefined)
        updateData.categoryIds = missionDTO.categoryIds;

      if (missionDTO.toPublish) {
        mission.publish();
      }

      mission.update(updateData);

      const result = await this.missionRepository.update(mission, connection);

      await connection.commit();

      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getMissionDetail(missionUuid: string): Promise<Mission | null> {
    return this.missionRepository.findByUuid(missionUuid);
  }

  async getMissions(filters: SearchMissionDTO): Promise<Mission[]> {
    throw new Error("Method not implemented.");
  }

  async registerVolunteer(
    missionUuid: string,
    volunteerUuid: string,
  ): Promise<void> {
    const connection: PoolConnection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      const mission = await this.missionRepository.findByUuid(
        missionUuid,
        connection,
        true,
      );

      if (!mission) throw new MissionNotFoundError();

      const registration = new Registration(
        {
          date: new Date(),
          status: RegistrationStatus.ONHOLD,
          volunteerUuid: volunteerUuid,
        },
        missionUuid,
      );

      mission.addRegistration(registration);

      await this.registrationRepository.saveRegistration(
        registration,
        missionUuid,
        connection,
      );

      await this.missionRepository.update(mission, connection);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
