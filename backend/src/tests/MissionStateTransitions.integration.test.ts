import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type { RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";
import { Database } from "../infra/database/DatabaseConfig.js";
import { UserRepository } from "../infra/repositories/UserRepository.js";
import { MissionRepository } from "../infra/repositories/MissionRepository.js";
import { RegistrationRepository } from "../infra/repositories/RegistrationRepository.js";
import { MissionService } from "../application/MissionService.js";
import { MissionStatus } from "../domain/mission/MissionStatusEnum.js";
import { MissionStatusError } from "../domain/mission/exceptions/MissionStatusError.js";

// ─── Shared Fixtures ──────────────────────────────────────────────────────────

let database: Pool;
let missionService: MissionService;

const orgaUuidOne = "user-uuid-1";

// ─── Time helpers ─────────────────────────────────────────────────────────────

const inDays = (n: number) => new Date(Date.now() + 86_400_000 * n).toISOString();

// ─── DB helpers ───────────────────────────────────────────────────────────────

const getMissionStatusFromDb = async (uuid: string): Promise<number> => {
  const [rows] = await database.execute<RowDataPacket[]>(
    "SELECT id_mission_status FROM mission WHERE mission_uuid = ?",
    [uuid],
  );
  if (!rows.length) throw new Error(`Mission ${uuid} not found in DB`);
  return rows[0]!.id_mission_status;
};

const getMissionCountFromDb = async (uuid: string): Promise<number> => {
  const [rows] = await database.execute<RowDataPacket[]>(
    "SELECT COUNT(*) as cnt FROM mission WHERE mission_uuid = ?",
    [uuid],
  );
  return rows[0]!.cnt as number;
};

const getInscriptionsStatusFromDb = async (missionUuid: string): Promise<number[]> => {
  const [rows] = await database.execute<RowDataPacket[]>(
    `SELECT i.id_inscription_status FROM inscription i
     JOIN mission m ON m.mission_id = i.id_mission
     WHERE m.mission_uuid = ?`,
    [missionUuid],
  );
  return rows.map((r) => r.id_inscription_status);
};

// ─── Factory helpers ──────────────────────────────────────────────────────────

const createDraftMission = async (withParticipant = false): Promise<string> => {
  const result = await missionService.createMission({
    name: `State-Test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: "Description valide pour les transitions.",
    dateStart: inDays(1),
    dateEnd: inDays(2),
    address: "10 rue des États",
    nbrVolunteerNeeded: 5,
    cityId: 1,
    categoryIds: [1],
    toPublish: false,
    organizers: [
      { organizerUuid: orgaUuidOne, isMain: true, isParticipant: withParticipant },
    ],
  });
  return result.getUuid();
};

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

const resetDatabase = async () => {
  await database.execute("SET FOREIGN_KEY_CHECKS = 0");
  await database.execute("TRUNCATE TABLE inscription");
  await database.execute("TRUNCATE TABLE mission_organizer");
  await database.execute("TRUNCATE TABLE mission_category");
  await database.execute("TRUNCATE TABLE mission");
  await database.execute("TRUNCATE TABLE `user`");
  await database.execute("SET FOREIGN_KEY_CHECKS = 1");

  await database.execute(
    "INSERT IGNORE INTO city (city_id, city_name, city_zip) VALUES (1, 'Paris', '75000')",
  );
  await database.execute(
    "INSERT IGNORE INTO role (role_id, role_name) VALUES (1,'SUPER_ADMIN'), (2,'ORGANISATEUR'), (3,'BENEVOLE')",
  );
  // 1 = DRAFT, 2 = PUBLISHED, 3 = FINISHED, 4 = CANCELED
  await database.execute(
    "INSERT IGNORE INTO mission_status (mission_status_id, mission_status_name) VALUES (1,'DRAFT'), (2,'PUBLISHED'), (3,'FINISHED'), (4,'CANCELED')",
  );
  await database.execute(
    "INSERT IGNORE INTO category (category_id, category_name) VALUES (1,'SPORT')",
  );
  // 1 = PENDING, 2 = VALIDATED, 3 = REFUSED, 4 = CANCELED (ajuste selon ton enum exact)
  await database.execute(
    "INSERT IGNORE INTO inscription_status (inscription_status_id, inscription_status_name) VALUES (1,'PENDING'), (2,'VALIDATED'), (3,'REFUSED'), (4,'CANCELED')",
  );

  await database.execute(
    "INSERT IGNORE INTO user (user_uuid, user_email, user_password, user_created_at, id_role) VALUES (?, 'orga@test.com', 'hashed', NOW(), 2)",
    [orgaUuidOne],
  );
};

beforeAll(() => {
  database = Database.getInstance().getPool();
  const userRepository = new UserRepository(database);
  const missionRepository = new MissionRepository(database);
  const registrationRepository = new RegistrationRepository(database);
  missionService = new MissionService(
    missionRepository,
    registrationRepository,
    userRepository,
    database,
  );
});

afterAll(async () => {
  await Database.getInstance().disconnect();
});

beforeEach(async () => {
  await resetDatabase();
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. TRANSITIONS VERS "PUBLISHED" (publishMission)
// ══════════════════════════════════════════════════════════════════════════════

describe("Transitions to PUBLISHED", () => {
  it("allows DRAFT -> PUBLISHED and updates DB status", async () => {
    const uuid = await createDraftMission();
    
    await missionService.publishMission(uuid);
    
    const dbStatus = await getMissionStatusFromDb(uuid);
    expect(dbStatus).toBe(2); // 2 = PUBLISHED
  });

  it("rejects PUBLISHED -> PUBLISHED (Already published)", async () => {
    const uuid = await createDraftMission();
    await missionService.publishMission(uuid); // Première publication OK
    
    // Deuxième publication doit jeter une erreur gérée par le PublishedState
    await expect(missionService.publishMission(uuid))
      .rejects.toThrow(MissionStatusError);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. TRANSITIONS VERS "CANCELED" (cancelMission)
// ══════════════════════════════════════════════════════════════════════════════

describe("Transitions to CANCELED", () => {
  it("rejects DRAFT -> CANCELED (A draft should be deleted, not canceled)", async () => {
    const uuid = await createDraftMission();
    
    // Le DraftState doit bloquer l'annulation
    await expect(missionService.cancelMission(uuid))
      .rejects.toThrow(MissionStatusError);
  });

  it("allows PUBLISHED -> CANCELED and updates DB status", async () => {
    const uuid = await createDraftMission();
    await missionService.publishMission(uuid);
    
    await missionService.cancelMission(uuid);
    
    const dbStatus = await getMissionStatusFromDb(uuid);
    expect(dbStatus).toBe(4); // 4 = CANCELED
  });

  it("PUBLISHED -> CANCELED must also cancel all active registrations", async () => {
    // On crée un brouillon AVEC un participant (l'organisateur)
    const uuid = await createDraftMission(true);
    await missionService.publishMission(uuid);
    
    // On annule la mission
    await missionService.cancelMission(uuid);
    
    // On vérifie que l'inscription a bien basculé en statut annulé
    const inscriptionStatuses = await getInscriptionsStatusFromDb(uuid);
    expect(inscriptionStatuses.length).toBeGreaterThan(0);
    // Vérifie que tous les statuts sont à l'ID qui correspond à CANCELED (ex: 4)
    inscriptionStatuses.forEach(status => {
       // Remplace 4 par l'ID réel de ton RegistrationStatus.CANCELED en DB
      expect(status).toBe(4); 
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. TRANSITIONS VERS "DELETED" (deleteMission)
// ══════════════════════════════════════════════════════════════════════════════

describe("Transitions to DELETED", () => {
  it("allows DRAFT -> DELETED and HARD DELETES from DB", async () => {
    const uuid = await createDraftMission();
    
    await missionService.deleteMission(uuid);
    
    const count = await getMissionCountFromDb(uuid);
    expect(count).toBe(0); // Suppression physique réussie
  });

  it("rejects PUBLISHED -> DELETED if there are active registrations", async () => {
    // Brouillon AVEC participant
    const uuid = await createDraftMission(true);
    await missionService.publishMission(uuid);
    
    // Le PublishedState doit interdire la suppression car `registrations.length > 0`
    await expect(missionService.deleteMission(uuid))
      .rejects.toThrow(MissionStatusError);
      
    // Vérification de sécurité : la mission est toujours en DB
    const count = await getMissionCountFromDb(uuid);
    expect(count).toBe(1);
  });

  it("allows PUBLISHED -> DELETED (Soft delete) if there are NO registrations", async () => {
    // Brouillon SANS participant
    const uuid = await createDraftMission(false);
    await missionService.publishMission(uuid);
    
    await missionService.deleteMission(uuid);
    
    // Attention : selon ton implémentation, le delete() d'une mission
    // set deletedAt = new Date(). Il faut vérifier que ça a bien marché.
    const [rows] = await database.execute<RowDataPacket[]>(
      "SELECT mission_deleted_at FROM mission WHERE mission_uuid = ?",
      [uuid],
    );
    expect(rows[0]!.mission_deleted_at).not.toBeNull();
  });
});