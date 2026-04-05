import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { Mission } from "../../domain/mission/Mission.js";
import { Registration } from "../../domain/registration/Registration.js";
import type { IMissionRepository } from "../../domain/mission/IMissionRepository.js";
import type { Organizer } from "../../domain/user/Organizer.js";
import type { Category } from "../../domain/category/Category.js";
import type { SearchMissionDTO } from "../../presentation/dto/mission/SearchMissionDTO.js";
import { MissionNameAlreadyExistError } from "../../domain/mission/exceptions/MissionNameAlreadyExistError.js";
import { MissionNotFoundError } from "../../domain/mission/exceptions/MissionNotFoundError.js";

export class MissionRepository implements IMissionRepository {
  constructor(private db: Pool) {}

  private async hydrateRegistrations(
    missionUuid: string,
    connection?: PoolConnection | Pool,
  ): Promise<Registration[] | []> {
    const db = connection || this.db;

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
    const [resultInscription] = await db.execute<RowDataPacket[]>(
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

  private async hydrateOrganizers(
    missionUuid: string,
    connection?: Pool | PoolConnection,
  ): Promise<Organizer[] | []> {
    const db = connection || this.db;

    const queryOrganizer = `SELECT mission_organizer_is_main, user.user_uuid AS organizerUuid
                            FROM mission_organizer
                            LEFT JOIN \`user\` ON mission_organizer.id_organizer = user.user_id
                            WHERE mission_organizer.id_mission = (SELECT mission_id FROM mission WHERE mission_uuid = ?)`;

    const [resultOrganizer] = await this.db.execute<RowDataPacket[]>(
      queryOrganizer,
      [missionUuid],
    );

    if (resultOrganizer.length === 0) return [];

    return resultOrganizer.map((row) => ({
      organizerUuid: row.organizerUuid,
      isMain: row.mission_organizer_is_main,
    }));
  }

  private async hydrateCategories(
    missionUuid: string,
    connection?: Pool | PoolConnection,
  ): Promise<Category[] | []> {
    const db = connection || this.db;
    const query = `SELECT * FROM mission_category
                    LEFT JOIN category ON mission_category.id_category = category.category_id`;
    const [result] = await db.execute<RowDataPacket[]>(query, [missionUuid]);

    if (result.length === 0) return [];

    return result.map((row) => ({
      id: row.category_id,
      name: row.category_name,
    }));
  }

  public async findByName(
    name: string,
    connection?: PoolConnection | Pool,
    lock?: boolean,
  ): Promise<Mission | null> {
    const db = connection || this.db;

    let query = `SELECT 
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
                      mission_status.mission_status_id AS status

                      FROM mission

                      LEFT JOIN mission_status ON mission.id_mission_status = mission_status.mission_status_id

                      WHERE mission.mission_name = ?`;

    if (lock) query += " FOR UPDATE";

    const [result] = await (db as Pool).execute<RowDataPacket[]>(query, [name]);

    const row = result[0];

    if (!row) return null;

    const organizerData: Organizer[] = await this.hydrateOrganizers(
      row.uuid,
      db,
    );
    const categoriesData = await this.hydrateCategories(row.uuid, db);
    const registrationsData = await this.hydrateRegistrations(row.uuid, db);

    return Mission.hydrate({
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
      categoryIds: categoriesData.map((category) => category.id),
      registrations: registrationsData,
      organizers: organizerData,
    });
  }

  public async findByUuid(
    uuid: string,
    connection?: Pool | PoolConnection,
    lock?: boolean,
  ): Promise<Mission | null> {
    const db = connection ? connection : this.db;

    let query = `SELECT 
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
                      mission_status.mission_status_id AS status

                      FROM mission

                      LEFT JOIN mission_status ON mission.id_mission_status = mission_status.mission_status_id

                      WHERE mission.mission_uuid = ?
                      GROUP BY mission.mission_uuid`;

    if (lock) query += " FOR UPDATE";

    const [result] = await (db as Pool).execute<RowDataPacket[]>(query, [uuid]);

    const row = result[0];

    if (!row) return null;

    const organizerData = await this.hydrateOrganizers(row.uuid, db);
    const categoriesData = await this.hydrateCategories(row.uuid, db);
    const registrationsData = await this.hydrateRegistrations(row.uuid, db);

    return Mission.hydrate({
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
      categoryIds: categoriesData.map((category) => category.id),
      registrations: registrationsData,
      organizers: organizerData,
    });
  }

  public async findMany(filters: SearchMissionDTO): Promise<Mission[]> {
    throw new Error("Method not implemented.");
  }

  public async create(
    missionToCreate: Mission,
    connection?: PoolConnection | Pool,
  ): Promise<Mission> {
    const db = connection || this.db;

    const queryMission = `INSERT INTO mission (
                            mission_uuid, mission_name, mission_description,
                            mission_date_start, mission_date_end, mission_address,
                            mission_nbr_volunteer_needed, mission_created_at,
                            id_city, id_mission_status
                          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const queryMissionOrganizer = `INSERT INTO mission_organizer (
                                      mission_organizer_is_main, id_mission, id_organizer
                                    ) 
                                    SELECT ?, ?, user.user_id FROM \`user\` WHERE user_uuid = ?`;

    const queryMissionCategory = `INSERT INTO mission_category (id_mission, id_category) VALUES (?, ?)`;

    try {
      const [resultMission] = await (db as Pool).execute<ResultSetHeader>(
        queryMission,
        [
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
        ],
      );

      const missionId = resultMission.insertId;

      for (const organizer of missionToCreate.getOrganizers()) {
        await (db as Pool).execute(queryMissionOrganizer, [
          organizer.isMain ?? false,
          missionId,
          organizer.organizerUuid,
        ]);
      }

      for (const categoryId of missionToCreate.getCategoryIds()) {
        await (db as Pool).execute(queryMissionCategory, [
          missionId,
          categoryId,
        ]);
      }

      return missionToCreate;
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "code" in error) {
        if ((error as { code: string }).code === "ER_DUP_ENTRY") {
          throw new MissionNameAlreadyExistError(
            `La mission : ${missionToCreate.getName()} existe déjà.`,
          );
        }
      }
      throw error;
    }
  }

  public async update(
    missionToUpdate: Mission,
    connection?: PoolConnection | Pool,
  ): Promise<Mission> {
    const db = connection || this.db;

    const queryMission = `UPDATE mission SET 
                          mission_name = ?, 
                          mission_description = ?, 
                          mission_date_start = ?, 
                          mission_date_end = ?, 
                          mission_address = ?, 
                          mission_nbr_volunteer_needed = ?,
                          mission_updated_at = ?,
                          mission_deleted_at = ?,
                          id_city = ?, 
                          id_mission_status = ? 
                          WHERE mission_uuid = ?`;

    const queryMissionCategory = `INSERT INTO mission_category (id_mission, id_category) VALUES (?, ?)`;

    const queryMissionOrganizer = `INSERT INTO mission_organizer (
                                      mission_organizer_is_main, id_mission, id_organizer
                                    ) 
                                    SELECT ?, ?, user.user_id FROM \`user\` WHERE user_uuid = ?`;

    try {
      await (db as Pool).execute<ResultSetHeader>(queryMission, [
        missionToUpdate.getName(),
        missionToUpdate.getDescription(),
        missionToUpdate.getDateStart(),
        missionToUpdate.getDateEnd(),
        missionToUpdate.getAddress(),
        missionToUpdate.getNbrVolunteerNeeded(),
        missionToUpdate.getUpdatedAt(),
        missionToUpdate.getDeletedAt(),
        missionToUpdate.getCityId(),
        missionToUpdate.getStatus(),
        missionToUpdate.getUuid(),
      ]);

      const queryMissionId = `SELECT mission.mission_id FROM mission WHERE mission.mission_uuid = ?`;
      const [idRow] = await (db as Pool).execute<RowDataPacket[]>(
        queryMissionId,
        [missionToUpdate.getUuid()],
      );
      const missionRow = idRow[0];
      if (!missionRow) throw new MissionNotFoundError();
      const missionId = missionRow.mission_id;

      const deleteCategoriesMission = `DELETE FROM mission_category WHERE id_mission = ?`;
      await (db as Pool).execute<ResultSetHeader>(deleteCategoriesMission, [
        missionId,
      ]);
      for (const categoryId of missionToUpdate.getCategoryIds()) {
        await (db as Pool).execute(queryMissionCategory, [
          missionId,
          categoryId,
        ]);
      }
      const deleteOrganizerMission = `DELETE FROM mission_organizer WHERE id_mission = ?`;
      await (db as Pool).execute<ResultSetHeader>(deleteOrganizerMission, [
        missionId,
      ]);
      for (const organizer of missionToUpdate.getOrganizers()) {
        await (db as Pool).execute(queryMissionOrganizer, [
          organizer.isMain ?? false,
          missionId,
          organizer.organizerUuid,
        ]);
      }
      return missionToUpdate;
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "code" in error) {
        if ((error as { code: string }).code === "ER_DUP_ENTRY") {
          throw new MissionNameAlreadyExistError(missionToUpdate.getName());
        }
      }
      throw error;
    }
  }
  
  public async delete(
    missionToDelete: Mission,
    connection?: PoolConnection | Pool,
  ): Promise<void> {
    const db = connection || this.db;
    const query = `DELETE FROM mission WHERE mission_uuid = ?`;
    await (db as Pool).execute<ResultSetHeader>(query, [
      missionToDelete.getUuid(),
    ]);
  }
}
