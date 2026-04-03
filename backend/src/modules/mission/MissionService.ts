import { MissionNameAlreadyExistError } from "../../domain/exceptions/mission/MissionNameAlreadyExistError.js";
import { Mission } from "./MissionModel.js";
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
import { MissionNotFoundError } from "../../domain/exceptions/mission/MissionNotFoundError.js";
import type { IRegistrationRepository } from "../registration/IRegistrationRepository.js";
import type { IOrganizer } from "../user/IOrganizer.js";

export class MissionService implements IMissionService {
  constructor(
    private missionRepository: IMissionRepository,
    private registrationRepository: IRegistrationRepository,
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

      const mission: Mission = new Mission({
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
    missionUuid: string,
  ): Promise<Mission> {
    throw new Error("Method not implemented.");
  }

  async getMissionDetail(missionUuid: string): Promise<Mission> {
    throw new Error("Method not implemented.");
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

      // On charge la mission AVEC LE VERROU (FOR UPDATE)
      // penser a mettre le missionId optionnel dans IMission et Mission
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

      // 4. On sauvegarde uniquement la nouvelle ligne
      // Tu auras besoin d'une méthode pour récupérer le missionId interne (number) si ton Repo l'utilise
      //const missionId = await this.missionRepository.getInternalId(missionUuid);
      await this.registrationRepository.saveRegistration(
        registration,
        missionUuid,
        connection,
      );

      await connection.commit(); // 5. On valide !
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
