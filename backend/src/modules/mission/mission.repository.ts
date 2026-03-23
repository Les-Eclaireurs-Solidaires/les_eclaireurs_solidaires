import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { IMissionRepository } from "./missionRepository.interface.js";
import { Mission } from "./mission.model.js";
import type { IMission } from "./mission.interface.js";

export class MissionRepository implements IMissionRepository {
  constructor(private db: Pool) {}

  async findByName(name: string): Promise<Mission | null> {
    const query = `SELECT 
                      mission_uuid AS uuid,
                      mission_name AS name,
                      mission_description AS description,
                      mission_date_start AS dateStart,
                      mission_date_end AS dateEnd,
                      mission_address AS address,
                      mission_nbr_volunteer_needed AS nbrVolunteerNeeded,
                      mission_created_at AS createdAt,
                      mission_updated_at AS updatedAt,
                      mission_deleted_at AS deletedAt,
                      id_city AS cityId,
                      mission_status.mission_status_name AS status,
                      GROUP CONCAT(mission_organizer.id_organizer SEPARATOR ',') AS organizerUuid
                      FROM mission
                      LEFT JOIN mission_status ON mission.id_mission_status = mission_status.mission_status_id
                      LEFT JOIN mission_organizer ON mission.mission_uuid = mission_organizer.id_mission
                      WHERE mission_name = ?
                      GROUP BY mission_uuid`;
    const [result] = await this.db.execute<RowDataPacket[]>(query, [name]);

    const row = result[0];
    if (!row) return null;

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
      organizerUuids: row.organizerUuid.split(","),
      regitrations: [],
    } as IMission);
  }

  async create(
    missionToCreate: Mission,
    organizerIds: number[],
  ): Promise<Mission> {
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
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT mission_status_id FROM mission_status WHERE mission_status_name = ?))`;

    const queryMissionOrganizer = `INSERT INTO mission_organizer (
                                    id_mission,
                                    id_organizer
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
      for (const organizerId of organizerIds) {
        await connection.execute(queryMissionOrganizer, [
          missionId,
          organizerId,
        ]);
      }
      await connection.commit();
      return missionToCreate;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
