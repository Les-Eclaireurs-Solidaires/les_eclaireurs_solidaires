import type { Pool, PoolConnection } from "mysql2/promise";
import type { IMissionRepository } from "../domain/mission/IMissionRepository.js";
import type { IMissionService } from "../domain/mission/IMissionService.js";
import type { IRegistrationRepository } from "../domain/registration/IRegistrationRepository.js";
import type { IUserRepository } from "../domain/user/IUserRepository.js";
import { Mission } from "../domain/mission/Mission.js";
import type { CreateMissionDTO } from "../presentation/dto/mission/CreateMissionDTO.js";
import { MissionNameAlreadyExistError } from "../domain/mission/exceptions/MissionNameAlreadyExistError.js";
import { UserNotFoundError } from "../domain/user/exceptions/UserNotFoundError.js";
import type { Organizer } from "../domain/user/Organizer.js";
import { Registration } from "../domain/registration/Registration.js";
import { MissionStatusError } from "../domain/mission/exceptions/MissionStatusError.js";
import { MissionStatus } from "../domain/mission/MissionStatusEnum.js";
import { RegistrationStatus } from "../domain/registration/RegistrationStatusEnum.js";
import type { UpdateMissionDTO } from "../presentation/dto/mission/UpdateMissionDTO.js";
import { MissionNotFoundError } from "../domain/mission/exceptions/MissionNotFoundError.js";
import type { MissionParam } from "../domain/mission/MissionParam.js";
import type { SearchMissionDTO } from "../presentation/dto/mission/SearchMissionDTO.js";


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
      const organizerList: Organizer[] = missionDTO.organizers.map(
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

      const updateData: Partial<MissionParam> = {};

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
