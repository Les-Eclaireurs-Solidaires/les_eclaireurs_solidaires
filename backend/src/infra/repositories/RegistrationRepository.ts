import type { Pool, PoolConnection } from "mysql2/promise";
import type { Registration } from "../../domain/registration/Registration.js";
import type { IRegistrationRepository } from "../../domain/registration/IRegistrationRepository.js";

export class RegistrationRepository implements IRegistrationRepository {
  constructor(private db: Pool) {}

  async saveRegistration(
    registration: Registration,
    missionUuid: string,
    connection?: Pool | PoolConnection,
  ): Promise<void> {
    const db = connection ?? this.db;

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
                            ?)
                          ON DUPLICATE KEY UPDATE
                            id_inscription_status = VALUES(id_inscription_status);`;

    await db.execute(query, [
      registration.getDate(),
      registration.getRecallSendAt(),
      registration.getVolunteerUuid(),
      missionUuid,
      registration.getStatus(),
    ]);
  }
}
