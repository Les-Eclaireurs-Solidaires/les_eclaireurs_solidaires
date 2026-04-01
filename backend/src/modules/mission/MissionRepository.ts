import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { IMissionRepository } from "./IMissionRepository.js";
import { Mission } from "./MissionModel.js";
import type { IMission } from "./IMissionModel.js";
import { Registration } from "../registration/RegistrationModel.js";
import { MissionNameAlreadyExistError } from "../../domain/exceptions/mission/MissionNameAlreadyExistError.js";

export class MissionRepository implements IMissionRepository {
  constructor(private db: Pool) {}

  private async hydrateRegistrations(
    missionUuid: string,
  ): Promise<Registration[]> {
    const queryInscription = `SELECT
                                inscription_id AS id,
                                inscription_date AS date,
                                inscription_recall_send_at AS recallSendAt, 
                                id_inscription_status AS status,
                                user.user_uuid AS volunteerUuid
                                FROM inscription
                                LEFT JOIN \`user\` ON inscription.id_user = user.user_id
                                WHERE id_mission = (SELECT mission_id FROM mission WHERE mission_uuid = ?)
                                ORDER BY inscription_date DESC`;
    const [resultInscription] = await this.db.execute<RowDataPacket[]>(
      queryInscription,
      [missionUuid],
    );

    if (resultInscription.length === 0) return [];

    return resultInscription.map(
      (row) =>
        new Registration(
          {
            date: row.date,
            recallSendAt: row.recallSendAt,
            status: row.status,
            volunteerUuid: row.volunteerUuid,
          },
          missionUuid,
        ),
    );
  }

  async findByName(name: string): Promise<Mission | null> {
    const query = `SELECT 
                      mission.mission_uuid AS uuid,
                      mission.mission_name AS name,
                      mission.mission_description AS description,
                      mission.mission_date_start AS dateStart,
                      mission.mission_date_end AS dateEnd,
                      mission.mission_address AS address,
                      mission.mission_nbr_volunteer_needed AS nbrVolunteerNeeded,
                      mission.mission_created_at AS createdAt,
                      mission.mission_updated_at AS updatedAt,
                      mission.mission_deleted_at AS deletedAt,
                      mission.id_city AS cityId,
                      mission_status.mission_status_name AS status,
                      GROUP_CONCAT(organizer.user_uuid SEPARATOR ',') AS organizerUuid
                      FROM mission
                      LEFT JOIN mission_status ON mission.id_mission_status = mission_status.mission_status_id
                      LEFT JOIN mission_organizer ON mission.mission_id = mission_organizer.id_mission
                      LEFT JOIN \`user\` AS organizer ON mission_organizer.id_organizer = organizer.user_id
                      WHERE mission.mission_name = ?
                      GROUP BY mission.mission_uuid`;
    const [result] = await this.db.execute<RowDataPacket[]>(query, [name]);

    const row = result[0];

    if (!row) return null;

    const registrationsData = await this.hydrateRegistrations(row.uuid);

    return new Mission({
      uuid: row.uuid,
      name: row.name,
      description: row.description,
      dateStart: row.dateStart,
      dateEnd: row.dateEnd,
      address: row.address,
      nbrVolunteerNeeded: row.nbrVolunteerNeeded,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
      cityId: row.cityId,
      status: row.status,
      organizerUuids: row.organizerUuid ? row.organizerUuid.split(",") : [],
      registrations: registrationsData,
    } as IMission);
  }

  async create(missionToCreate: Mission): Promise<Mission> {
    const queryMission = `INSERT INTO mission (
                            mission_uuid,
                            mission_name,
                            mission_description,
                            mission_date_start,
                            mission_date_end,
                            mission_address,
                            mission_nbr_volunteer_needed,
                            mission_created_at,
                            id_city,
                            id_mission_status
                            )
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const queryMissionOrganizer = `INSERT INTO mission_organizer (
                                    id_mission,
                                    id_organizer
                                    )
                                    SELECT ?, user.user_id
                                    FROM \`user\`
                                    WHERE user_uuid = ?`;

    const queryMissionCategory = `INSERT INTO mission_category (
                                      id_mission,
                                      id_category
                                      )
                                      VALUES (?, ?)`;

    const connection = await this.db.getConnection();

    try {
      await connection.beginTransaction();
      const [result] = await connection.execute<ResultSetHeader>(queryMission, [
        missionToCreate.getUuid(),
        missionToCreate.getName(),
        missionToCreate.getDescription(),
        missionToCreate.getDateStart(),
        missionToCreate.getDateEnd(),
        missionToCreate.getAddress(),
        missionToCreate.getNbrVolunteerNeeded(),
        missionToCreate.getCreatedAt(),
        missionToCreate.getCityId(),
        missionToCreate.getStatus(),
      ]);
      const missionId = result.insertId;

      for (const organizerUuid of missionToCreate.getOrganizerUuid()) {
        await connection.execute(queryMissionOrganizer, [
          missionId,
          organizerUuid,
        ]);
      }

      for (const categoryId of missionToCreate.getCategoryIds()) {
        await connection.execute(queryMissionCategory, [missionId, categoryId]);
      }

      await connection.commit();

      return missionToCreate;
    } catch (error: unknown) {
      await connection.rollback();

      if (typeof error === "object" && error !== null && "code" in error) {
        if ((error as { code: string }).code === "ER_DUP_ENTRY") {
          throw new MissionNameAlreadyExistError(
            `La mission : ${missionToCreate.getName()} existe déjà.`,
          );
        }
      }

      throw error;
    } finally {
      connection.release();
    }
  }
}
