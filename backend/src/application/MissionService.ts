import type { Pool, PoolConnection } from "mysql2/promise";
import type { IMissionRepository } from "../domain/mission/IMissionRepository.js";
import type { IMissionService } from "../domain/mission/IMissionService.js";
import type { IRegistrationRepository } from "../domain/registration/IRegistrationRepository.js";
import type { IUserRepository } from "../domain/user/IUserRepository.js";
import { Mission } from "../domain/mission/Mission.js";
import type { CreateMissionDTO } from "../presentation/dto/mission/CreateMissionDTO.js";
import { MissionNameAlreadyExistError } from "../domain/mission/exceptions/MissionNameAlreadyExistError.js";
import { UserNotFoundError } from "../domain/user/exceptions/UserNotFoundError.js";
import { Registration } from "../domain/registration/Registration.js";
import { RegistrationStatus } from "../domain/registration/RegistrationStatusEnum.js";
import type { UpdateMissionDTO } from "../presentation/dto/mission/UpdateMissionDTO.js";
import { MissionNotFoundError } from "../domain/mission/exceptions/MissionNotFoundError.js";
import { MissionStatus } from "../domain/mission/MissionStatusEnum.js";
import { MissionStatusError } from "../domain/mission/exceptions/MissionStatusError.js";

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

      const mission: Mission = Mission.create(
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
      );

      mission.getState().validate(mission);

      if (missionDTO.toPublish) {
        mission.publish();
      }

      const missionCreate: Mission = await this.missionRepository.create(
        mission,
        connection,
      );

      if (
        missionCreate.getRegistrations() &&
        missionCreate.getRegistrations().length > 0
      ) {
        for (const registration of mission.getRegistrations()) {
          await this.registrationRepository.saveRegistration(
            registration,
            uuid,
            connection,
          );
        }
      }

      await connection.commit();

      return missionCreate;
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

      mission.publish();

      await this.saveMissionWithRegistration(mission, connection);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  async updateMission(
    missionDTO: UpdateMissionDTO,
    missionUuid: string,
  ): Promise<Mission> {
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
        missionDTO.organizers !== undefined &&
        missionDTO.organizers.length !== 0
      ) {
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
      }

      mission.update(missionDTO);

      await this.saveMissionWithRegistration(mission, connection);

      await connection.commit();

      return mission;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
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

      await this.saveMissionWithRegistration(mission, connection);

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

      if (mission.getStatus() === MissionStatus.DRAFT) {
        await this.missionRepository.delete(mission, connection);
      } else {
        await this.saveMissionWithRegistration(mission, connection);
      }

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
  private async saveMissionWithRegistration(
    mission: Mission,
    connection: PoolConnection,
  ) {
    await this.missionRepository.update(mission, connection);
    if (mission.getRegistrations() && mission.getRegistrations().length > 0) {
      for (const registration of mission.getRegistrations()) {
        await this.registrationRepository.saveRegistration(
          registration,
          mission.getUuid(),
          connection,
        );
      }
    }
  }
}
