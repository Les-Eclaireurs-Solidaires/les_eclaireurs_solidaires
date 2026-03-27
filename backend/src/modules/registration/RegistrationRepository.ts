import type { Pool, RowDataPacket } from "mysql2/promise";
import type { Registration } from "./RegistrationModel.js";
import type { IRegistrationRepository } from "./IRegistrationRepository.js";
import type { RegistrationStatus } from "./RegistrationStatusEnum.js";
import { MissionNotFoundError } from "../../domain/exceptions/mission/MissionNotFoundError.js";
import { MissionFullError } from "../../domain/exceptions/mission/MissionFullError.js";

export class RegistrationRepository implements IRegistrationRepository {
  constructor(private db: Pool) {}

  async saveRegistration(registration: Registration): Promise<void> {
    const queryLock = `SELECT mission_nbr_volunteer_needed, mission_id, mission_name FROM mission WHERE mission_uuid = ? FOR UPDATE`;
    const queryCount = `SELECT COUNT(*) as count FROM inscription WHERE id_mission = ? AND id_inscription_status IN (1, 2)`;
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
                            ?,
                            ?)`;
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      const [missionRows] = await connection.execute<RowDataPacket[]>(
        queryLock,
        [registration.getMissionUuid()],
      );
      const missionRow = missionRows[0];

      if (!missionRow) throw new MissionNotFoundError();

      const capacity = missionRow.mission_nbr_volunteer_needed;
      const missionId = missionRow.mission_id;

      const [countRows] = await connection.execute<RowDataPacket[]>(
        queryCount,
        [missionId],
      );
      const count = countRows[0]?.count;

      if (count >= capacity) {
        throw new MissionFullError(missionRow.mission_name);
      }

      await connection.execute(query, [
        registration.getDate(),
        registration.getRecallSendAt(),
        registration.getVolunteerUuid(),
        missionId,
        registration.getStatus(),
      ]);
      await connection.commit();
      return;
    } catch (error: any) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
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
