import type { Pool } from "mysql2/promise";
import type { Registration } from "./registration.model.js";
import type { IRegistrationRepository } from "./registrationRepository.interface.js";

export class RegistrationRepository implements IRegistrationRepository {
  constructor(private db: Pool) {}

  async saveRegistration(registration: Registration): Promise<void> {
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

    await this.db.execute(query, [
      registration.getDate(),
      registration.getRecallSendAt(),
      registration.getVolunteerUuid(),
      registration.getMissionUuid(),
      registration.getStatus(),
    ]);
  }
}
