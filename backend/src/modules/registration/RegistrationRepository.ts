import type { Pool, ResultSetHeader, PoolConnection } from "mysql2/promise";
import type { Registration } from "./RegistrationModel.js";
import type { IRegistrationRepository } from "./IRegistrationRepository.js";
import type { RegistrationStatus } from "./RegistrationStatusEnum.js";

export class RegistrationRepository implements IRegistrationRepository {
  constructor(private db: Pool) {}

  async saveRegistration(
    registration: Registration,
    missionUuid: string,
    connection?: Pool | PoolConnection
  ): Promise<void> {
    const dbExecutor = connection || this.db;
    
    const query = `INSERT INTO inscription (
                            inscription_date,
                            inscription_recall_send_at,
                            id_user,
                            id_mission,
                            id_inscription_status
                            )
                          VALUES (
                            ?, 
                            ?, 
                            (SELECT user_id FROM user WHERE user_uuid = ?),
                            (SELECT mission_id FROM mission WHERE mission_uuid = ?),
                            ?)`;

    await (dbExecutor as Pool).execute(query, [
      registration.getDate(),
      registration.getRecallSendAt(),
      registration.getVolunteerUuid(),
      missionUuid,
      registration.getStatus(),
    ]);
  }

  async updateRegistrationStatus(
    targetUuid: string,
    missionUuid: string,
    registrationStatus: RegistrationStatus,
    connection?: Pool | PoolConnection
  ): Promise<boolean> {
    const dbExecutor = connection || this.db;

    const query = `UPDATE inscription 
                   SET id_inscription_status = ? 
                   WHERE id_user = (SELECT user_id FROM user WHERE user_uuid = ?) 
                   AND id_mission = (SELECT mission_id FROM mission WHERE mission_uuid = ?)`;

    const [result] = await (dbExecutor as Pool).execute<ResultSetHeader>(query, [
      registrationStatus,
      targetUuid,
      missionUuid,
    ]);
    
    return result.affectedRows > 0;
  }
}
