import type { Pool, PoolConnection } from "mysql2/promise";
import type { IRegistrationRepository } from "../domain/registration/IRegistrationRepository.js";
import type { IUserRepository } from "../domain/user/IUserRepository.js";
import { Mission } from "../domain/mission/Mission.js";
import type { CreateMissionDTO } from "../presentation/dto/mission/CreateMissionDTO.js";
import { MissionNameAlreadyExistError } from "../domain/mission/exceptions/MissionNameAlreadyExistError.js";
import { UserNotFoundError } from "../domain/user/exceptions/UserNotFoundError.js";
import { Registration } from "../domain/registration/Registration.js";
import { RegistrationStatus } from "../domain/registration/RegistrationStatusEnum.js";
import { MissionNotFoundError } from "../domain/mission/exceptions/MissionNotFoundError.js";
import { MissionStatusError } from "../domain/mission/exceptions/MissionStatusError.js";
import type { SearchMissionDTO } from "../presentation/dto/mission/SearchMissionDTO.js";
import type { EventEmitter } from "node:stream";
import type { IMissionService } from "../domain/mission/interfaces/IMissionService.js";
import type { IMissionRepository } from "../domain/mission/interfaces/IMissionRepository.js";
import type { IActor } from "../domain/user/IActor.js";
import type { UpdateMissionDetailsDTO } from "../presentation/dto/mission/UpdateMissionDetailsDTO.js";
import type { UpdateMissionOrganizersDTO } from "../presentation/dto/mission/UpdateMissionOrganizersDTO.js";

export class MissionService implements IMissionService {
  constructor(
    private missionRepository: IMissionRepository,
    private userRepository: IUserRepository,
    private db: Pool,
    private eventBus: EventEmitter,
  ) {}

  async createMission(
    missionDTO: CreateMissionDTO,
    actor: IActor,
  ): Promise<Mission> {
    const connection: PoolConnection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      const existingMission = await this.missionRepository.findByName(
        missionDTO.name,
        connection,
      );

      if (existingMission) {
        throw new MissionNameAlreadyExistError(missionDTO.name);
      }

      const uuid: string = crypto.randomUUID();

      if (!missionDTO.organizers || missionDTO.organizers.length === 0)
        throw new MissionStatusError(
          "La mission doit avoir au moins un organisateur.",
        );
      for (const organizer of missionDTO.organizers) {
        const user = await this.userRepository.findByUuid(
          organizer.organizerUuid,
          connection,
          true,
        );
        if (!user) {
          throw new UserNotFoundError();
        }
      }
      const newMission: Mission = Mission.create(
        {
          uuid: uuid,
          name: missionDTO.name,
          description: missionDTO.description || null,
          dateStart: new Date(missionDTO.dateStart as string),
          dateEnd: new Date(missionDTO.dateEnd as string),
          address: missionDTO.address || "",
          nbrVolunteerNeeded: missionDTO.nbrVolunteerNeeded || 0,
          cityId: missionDTO.cityId || 0,
          categoryIds: missionDTO.categoryIds || [],
          organizers: [],
          registrations: [],
        },
        missionDTO.organizers,
        actor,
      );

      newMission.getState().validate(newMission);

      if (missionDTO.toPublish) {
        newMission.publish();
      }
      const missionToCreate: Mission = await this.missionRepository.create(
        newMission,
        connection,
      );
      missionToCreate.getEvents().forEach((event) => {
        this.eventBus.emit(event.eventName, event, connection);
      });

      await connection.commit();

      return missionToCreate;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  async updateMissionDetails(
    dto: UpdateMissionDetailsDTO,
    missionUuid: string,
    actor: IActor,
  ): Promise<Mission> {
    const connection: PoolConnection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      const missionToUpdate = await this.missionRepository.findByUuid(
        missionUuid,
        connection,
        true,
      );
      if (!missionToUpdate) {
        throw new MissionNotFoundError();
      }

      missionToUpdate.updateDetails(dto, actor);

      await this.missionRepository.updateDetails(missionToUpdate, connection);

      missionToUpdate.getEvents().forEach((event) => {
        this.eventBus.emit(event.eventName, event, connection);
      });

      await connection.commit();

      return missionToUpdate;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  async updateMissionOrganizers(
    dto: UpdateMissionOrganizersDTO,
    missionUuid: string,
    actor: IActor,
  ): Promise<Mission> {
    const connection: PoolConnection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      const missionToUpdate = await this.missionRepository.findByUuid(
        missionUuid,
        connection,
        true,
      );
      if (!missionToUpdate) {
        throw new MissionNotFoundError();
      }
      if (dto.organizers !== undefined && dto.organizers.length !== 0) {
        for (const organizer of dto.organizers) {
          const user = await this.userRepository.findByUuid(
            organizer.organizerUuid,
            connection,
            true,
          );
          if (!user) {
            throw new UserNotFoundError();
          }
        }
      }

      missionToUpdate.updateOrganizers(dto, actor);

      await this.missionRepository.updateOrganizers(
        missionToUpdate,
        connection,
      );

      missionToUpdate.getEvents().forEach((event) => {
        this.eventBus.emit(event.eventName, event, connection);
      });

      await connection.commit();

      return missionToUpdate;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  async publishMission(missionUuid: string): Promise<void> {
    const connection: PoolConnection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      const mission = await this.missionRepository.findByUuid(
        missionUuid,
        connection,
        true,
      );
      if (!mission) {
        throw new MissionNotFoundError();
      }
      if (
        mission.getOrganizers() !== undefined &&
        mission.getOrganizers().length !== 0
      ) {
        for (const organizer of mission.getOrganizers()) {
          const user = await this.userRepository.findByUuid(
            organizer.organizerUuid,
            connection,
            true,
          );
          if (!user) {
            throw new UserNotFoundError();
          }
        }
      }
      mission.publish();

      mission
        .getEvents()
        .forEach((event) =>
          this.eventBus.emit(event.eventName, event, connection),
        );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  async getMissionDetail(missionUuid: string): Promise<Mission> {
    const mission = await this.missionRepository.findByUuid(missionUuid);
    if (!mission) {
      throw new MissionNotFoundError();
    }
    return mission;
  }
  async getMissions(filters: SearchMissionDTO): Promise<Mission[]> {
    return this.missionRepository.findMany(filters);
  }
  async finishMission(
    missionUuid: string,
    presentUuids: string[],
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async cancelMission(missionUuid: string): Promise<void> {
    const connection: PoolConnection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      const mission = await this.missionRepository.findByUuid(
        missionUuid,
        connection,
        true,
      );
      if (!mission) {
        throw new MissionNotFoundError();
      }

      mission.cancel();

      await this.missionRepository.updateDetails(mission, connection);

      mission
        .getEvents()
        .forEach((event) =>
          this.eventBus.emit(event.eventName, event, connection),
        );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  async deleteMission(missionUuid: string): Promise<void> {
    const connection: PoolConnection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      const mission = await this.missionRepository.findByUuid(
        missionUuid,
        connection,
        true,
      );
      if (!mission) {
        throw new MissionNotFoundError();
      }

      mission.delete();

      mission
        .getEvents()
        .forEach((event) =>
          this.eventBus.emit(event.eventName, event, connection),
        );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
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

      /* mission.addRegistration(registration); */

      

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
