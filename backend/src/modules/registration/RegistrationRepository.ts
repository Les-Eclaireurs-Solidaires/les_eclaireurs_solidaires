import type { Pool } from "mysql2/promise";
import type { Registration } from "./RegistrationModel.js";
import type { IRegistrationRepository } from "./IRegistrationRepository.js";
import type { RegistrationStatus } from "./RegistrationStatusEnum.js";

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

  async updateRegistrationStatus(
    targetUuid: string,
    missionUuid: string,
    registrationStatus: RegistrationStatus,
  ): Promise<void> {
    const query = `UPDATE inscription SET id_inscription_status = ? WHERE id_user = (SELECT user_id FROM user WHERE user_uuid = ?) AND id_mission = (SELECT mission_id FROM mission WHERE mission_uuid = ?)`;

    await this.db.execute(query, [registrationStatus, targetUuid, missionUuid]);
  }
}
