import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { CreateMissionDTO } from "../modules/mission/dtos/CreateMissionDTO.js";
import { type Pool, type RowDataPacket } from "mysql2/promise";
import { Database } from "../infra/database/DatabaseConfig.js";
import { AppConfig } from "../infra/web/AppConfig.js";
import { AuthController } from "../modules/auth/AuthController.js";
import { MissionController } from "../modules/mission/MissionController.js";
import { AuthService } from "../modules/auth/AuthService.js";
import { type Express } from "express";
import { TokenService } from "../infra/security/TokenService.js";
import { HashService } from "../infra/security/HashService.js";
import { UserRepository } from "../modules/user/UserRepository.js";
import { MissionService } from "../modules/mission/MissionService.js";
import { MissionRepository } from "../modules/mission/MissionRepository.js";
import { RegistrationRepository } from "../modules/registration/RegistrationRepository.js";
import { MissionStatus } from "../modules/mission/MissionStatusEnum.js";
import { MissionNameAlreadyExistError } from "../domain/exceptions/mission/MissionNameAlreadyExistError.js";
import { MissionDateError } from "../domain/exceptions/mission/MissionDateError.js";

// ─── Fixtures partagées ────────────────────────────────────────────────────────

let app: Express;
let database: Pool;
let missionService: MissionService;

const orgaUuidOne = "user-uuid-1";
const orgaUuidTwo = "user-uuid-2";
const orgaUuidThree = "user-uuid-3";

let orgaOneId: number;
let orgaTwoId: number;
let orgaThreeId: number;

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getMissionFromDb = async (name: string): Promise<RowDataPacket[]> => {
  const [rows] = await database.execute<RowDataPacket[]>(
    "SELECT * FROM mission WHERE mission_name = ?",
    [name],
  );
  return rows;
};

const getInscriptionsForMission = async (
  missionUuid: string,
): Promise<RowDataPacket[]> => {
  const [rows] = await database.execute<RowDataPacket[]>(
    `SELECT i.* FROM inscription i
     JOIN mission m ON m.mission_id = i.id_mission
     WHERE m.mission_uuid = ?`,
    [missionUuid],
  );
  return rows;
};

const getOrganizersForMission = async (
  missionUuid: string,
): Promise<RowDataPacket[]> => {
  const [rows] = await database.execute<RowDataPacket[]>(
    `SELECT mo.* FROM mission_organizer mo
     JOIN mission m ON m.mission_id = mo.id_mission
     WHERE m.mission_uuid = ?`,
    [missionUuid],
  );
  return rows;
};

const validMissionBase = (): CreateMissionDTO => ({
  name: `Mission Test ${Date.now()}`,
  description: "Description valide pour les tests avancés.",
  dateStart: new Date(Date.now() + 86_400_000).toISOString(), // +1 jour
  dateEnd: new Date(Date.now() + 172_800_000).toISOString(), // +2 jours
  address: "14 rue du Test",
  nbrVolunteerNeeded: 5,
  cityId: 1,
  categoryIds: [1, 2],
  toPublish: false,
  organizers: [
    { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
  ],
});

// ─── Setup ─────────────────────────────────────────────────────────────────────

const setupDatabase = async () => {
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
  await database.execute(`
    INSERT IGNORE INTO role (role_id, role_name)
    VALUES (1,'SUPER_ADMIN'), (2,'ORGANISATEUR'), (3,'BENEVOLE')`);
  await database.execute(`
    INSERT IGNORE INTO mission_status (mission_status_id, mission_status_name)
    VALUES (1,'DRAFT'), (2,'PUBLISHED'), (3,'FINISHED'), (4,'CANCELED')`);
  await database.execute(`
    INSERT IGNORE INTO category (category_id, category_name)
    VALUES (1,'SPORT'), (2,'Aide et autre'), (3,'Autre catégorie'), (4,'Catégorie de test')`);
  await database.execute(
    "INSERT IGNORE INTO inscription_status (inscription_status_id, inscription_status_name) VALUES (1,'PENDING'), (2,'VALIDATED'), (3,'REFUSED')",
  );

  const users: [string, string][] = [
    [orgaUuidOne, "orga1@test.com"],
    [orgaUuidTwo, "orga2@test.com"],
    [orgaUuidThree, "orga3@test.com"],
  ];

  for (const [uuid, email] of users) {
    await database.execute(
      "INSERT IGNORE INTO user (user_uuid, user_email, user_password, user_created_at, id_role) VALUES (?, ?, 'hash', NOW(), 2)",
      [uuid, email],
    );
  }

  const resolve = async (uuid: string): Promise<number> => {
    const [rows] = await database.execute<RowDataPacket[]>(
      "SELECT user_id FROM user WHERE user_uuid = ?",
      [uuid],
    );
    return rows[0]!.user_id;
  };

  orgaOneId = await resolve(orgaUuidOne);
  orgaTwoId = await resolve(orgaUuidTwo);
  orgaThreeId = await resolve(orgaUuidThree);
};

beforeAll(() => {
  database = Database.getInstance().getPool();

  const hashService = new HashService();
  const tokenService = new TokenService();
  const userRepository = new UserRepository(database);
  const missionRepository = new MissionRepository(database);
  const registrationRepository = new RegistrationRepository(database);
  const authService = new AuthService(
    userRepository,
    hashService,
    tokenService,
  );

  missionService = new MissionService(
    missionRepository,
    registrationRepository,
    database,
  );

  const authController = new AuthController(authService, tokenService);
  const missionController = new MissionController(missionService, tokenService);
  app = new AppConfig(authController, missionController).getApp();
});

afterAll(async () => {
  await Database.getInstance().disconnect();
});

beforeEach(async () => {
  await setupDatabase();
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. INVARIANTS MÉTIER — VALIDATIONS DU MODÈLE
// ══════════════════════════════════════════════════════════════════════════════

describe("Model invariants", () => {
  it("must reject a mission whose start date equals the end date", async () => {
    const sameDate = new Date(Date.now() + 86_400_000).toISOString();
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name: "Same Date",
        dateStart: sameDate,
        dateEnd: sameDate,
      }),
    ).rejects.toThrow(MissionDateError);
  });

  it("must reject a mission with a start date in the past", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name: "Past Start",
        dateStart: "2020-01-01T00:00:00.000Z",
        dateEnd: new Date(Date.now() + 86_400_000).toISOString(),
      }),
    ).rejects.toThrow(MissionDateError);
  });

  it("must reject nbrVolunteerNeeded = 0", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name: "Zero Volunteers",
        nbrVolunteerNeeded: 0,
      }),
    ).rejects.toThrow(); // Adapte à ton exception métier si tu en as une
  });

  it("must reject a negative nbrVolunteerNeeded", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name: "Negative Volunteers",
        nbrVolunteerNeeded: -5,
      }),
    ).rejects.toThrow();
  });

  it("must reject an empty name", async () => {
    await expect(
      missionService.createMission({ ...validMissionBase(), name: "" }),
    ).rejects.toThrow();
  });

  it("must reject a name that is only whitespace", async () => {
    await expect(
      missionService.createMission({ ...validMissionBase(), name: "   " }),
    ).rejects.toThrow();
  });

  it("must reject an empty description", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name: "Empty Desc",
        description: "",
      }),
    ).rejects.toThrow();
  });

  it("must reject an empty category list", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name: "No Category",
        categoryIds: [],
      }),
    ).rejects.toThrow();
  });

  it("must reject an empty organizer list", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name: "No Organizer",
        organizers: [],
      }),
    ).rejects.toThrow();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. INVARIANTS MÉTIER — RÈGLES ORGANISATEURS
// ══════════════════════════════════════════════════════════════════════════════

describe("Organizer business rules", () => {
  it("must reject a list with no main organizer (isMain: false for all)", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name: "No Main Orga",
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: false, isParticipant: false },
          { organizerUuid: orgaUuidTwo, isMain: false, isParticipant: false },
        ],
      }),
    ).rejects.toThrow(); // Adapte à ton exception NoMainOrganizerError
  });

  it("must reject a list with two main organizers", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name: "Two Main Orgas",
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
          { organizerUuid: orgaUuidTwo, isMain: true, isParticipant: false },
        ],
      }),
    ).rejects.toThrow(); // Adapte à ton exception
  });

  it("must reject a duplicate organizer uuid in the same list", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name: "Duplicate Orga",
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
          { organizerUuid: orgaUuidOne, isMain: false, isParticipant: true },
        ],
      }),
    ).rejects.toThrow();
  });

  it("must NOT create an inscription for a non-participant organizer", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name: "Orga Non Participant",
      organizers: [
        { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
      ],
    });

    expect(result.getRegistrations()).toHaveLength(0);
    const inscriptions = await getInscriptionsForMission(result.getUuid());
    expect(inscriptions).toHaveLength(0);
  });

  it("must persist all organizers to mission_organizer table", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name: "Orga Persistence Check",
      organizers: [
        { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
        { organizerUuid: orgaUuidTwo, isMain: false, isParticipant: false },
      ],
    });

    const organizers = await getOrganizersForMission(result.getUuid());
    expect(organizers).toHaveLength(2);

    const mainOrga = organizers.find((o) => o.mission_organizer_is_main === 1);
    expect(mainOrga).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. STATUTS & PUBLICATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Mission status rules", () => {
  it("must create with DRAFT status when toPublish is false, even with participant", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name: "Draft With Participant",
      toPublish: false,
      organizers: [
        { organizerUuid: orgaUuidOne, isMain: true, isParticipant: true },
      ],
    });

    // L'inscription en mémoire doit exister, mais le statut est DRAFT
    expect(result.getStatus()).toBe(MissionStatus.DRAFT);
    expect(result.getRegistrations()).toHaveLength(1);
  });

  it("must store PUBLISHED status in DB when toPublish is true", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name: "Published In DB",
      toPublish: true,
      organizers: [
        { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
      ],
    });

    const rows = await getMissionFromDb("Published In DB");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.id_mission_status).toBe(2); // 2 = PUBLISHED
  });

  it("must store DRAFT status in DB when toPublish is false", async () => {
    await missionService.createMission({
      ...validMissionBase(),
      name: "Draft In DB",
      toPublish: false,
    });

    const rows = await getMissionFromDb("Draft In DB");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.id_mission_status).toBe(1); // 1 = DRAFT
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. CATÉGORIES
// ══════════════════════════════════════════════════════════════════════════════

describe("Mission categories", () => {
  it("must persist all categories in mission_category table", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name: "All Categories",
      categoryIds: [1, 2, 3],
    });

    const [rows] = await database.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM mission_category mc
       JOIN mission m ON m.mission_id = mc.id_mission
       WHERE m.mission_uuid = ?`,
      [result.getUuid()],
    );
    expect(rows[0]!.count).toBe(3);
  });

  it("must reject a non-existent category (FK constraint)", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name: "Bad Category",
        categoryIds: [9999],
      }),
    ).rejects.toThrow();

    // Rollback vérifié : aucune mission créée
    const rows = await getMissionFromDb("Bad Category");
    expect(rows).toHaveLength(0);
  });

  it("must reject duplicate categoryIds in the same mission", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name: "Duplicate Cat",
        categoryIds: [1, 1, 2],
      }),
    ).rejects.toThrow();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. TRANSACTIONS & ROLLBACKS
// ══════════════════════════════════════════════════════════════════════════════

describe("Transaction integrity (rollbacks)", () => {
  it("ROLLBACK : must not persist the mission if category saving fails mid-transaction", async () => {
    const name = "Mission Category Rollback";

    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name,
        categoryIds: [1, 9999], // La 2e FK va échouer
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
        ],
      }),
    ).rejects.toThrow();

    const rows = await getMissionFromDb(name);
    expect(rows).toHaveLength(0);
  });

  it("ROLLBACK : must not persist the mission if organizer saving fails mid-transaction", async () => {
    const name = "Mission Organizer Rollback";

    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name,
        // UUID inexistant → la FK user_id sur mission_organizer va échouer
        organizers: [
          { organizerUuid: "uuid-fantome", isMain: true, isParticipant: false },
        ],
      }),
    ).rejects.toThrow();

    const rows = await getMissionFromDb(name);
    expect(rows).toHaveLength(0);
  });

  it("ROLLBACK : partial organizers — second organizer fails, first should not be saved", async () => {
    const name = "Mission Partial Orga Rollback";

    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name,
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false }, // ✅ valide
          {
            organizerUuid: "uuid-fantome",
            isMain: false,
            isParticipant: false,
          }, // ❌ FK échouera
        ],
      }),
    ).rejects.toThrow();

    const rows = await getMissionFromDb(name);
    expect(rows).toHaveLength(0);

    // Aucun organizer ne doit traîner non plus
    const [orgas] = await database.execute<RowDataPacket[]>(
      "SELECT * FROM mission_organizer WHERE id_mission = (SELECT mission_id FROM mission WHERE mission_name = ? LIMIT 1)",
      [name],
    );
    expect(orgas).toHaveLength(0);
  });

  it("ROLLBACK : second inscription fails → mission AND first inscription rolled back", async () => {
    const name = "Mission Double Inscription Rollback";

    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name,
        toPublish: true,
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: true }, // ✅
          { organizerUuid: "uuid-fantome", isMain: false, isParticipant: true }, // ❌
        ],
      }),
    ).rejects.toThrow();

    const rows = await getMissionFromDb(name);
    expect(rows).toHaveLength(0);

    const [inscriptions] = await database.execute<RowDataPacket[]>(
      "SELECT * FROM inscription WHERE id_user = ?",
      [orgaOneId],
    );
    expect(inscriptions).toHaveLength(0); // La 1re inscription doit aussi être rollbackée
  });

  it("must not leave orphan data after any failed creation", async () => {
    const name = "Orphan Check";

    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name,
        cityId: 9999, // FK City va échouer immédiatement
      }),
    ).rejects.toThrow();

    const [missions] = await database.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as c FROM mission WHERE mission_name = ?",
      [name],
    );
    const [categories] = await database.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as c FROM mission_category",
    );
    const [organizers] = await database.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as c FROM mission_organizer",
    );
    const [inscriptions] = await database.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as c FROM inscription",
    );

    expect(missions[0]!.c).toBe(0);
    expect(categories[0]!.c).toBe(0);
    expect(organizers[0]!.c).toBe(0);
    expect(inscriptions[0]!.c).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. IDEMPOTENCE & CONCURRENCE
// ══════════════════════════════════════════════════════════════════════════════

describe("Idempotency and concurrency", () => {
  it("must reject the second call when two missions with the same name are created sequentially", async () => {
    const payload: CreateMissionDTO = {
      ...validMissionBase(),
      name: "Mission Sequential Duplicate",
    };

    await missionService.createMission(payload);

    await expect(missionService.createMission(payload)).rejects.toThrow(
      MissionNameAlreadyExistError,
    );

    // Une seule mission en base
    const rows = await getMissionFromDb(payload.name);
    expect(rows).toHaveLength(1);
  });

  it("must handle concurrent creation of two missions with different names without interference", async () => {
    const r1 = await missionService.createMission({
      ...validMissionBase(),
      name: "Sequential A",
    });
    const r2 = await missionService.createMission({
      ...validMissionBase(),
      name: "Sequential B",
    });

    expect(r1.getName()).toBe("Sequential A");
    expect(r2.getName()).toBe("Sequential B");

    const rowsA = await getMissionFromDb("Sequential A");
    const rowsB = await getMissionFromDb("Sequential B");
    expect(rowsA).toHaveLength(1);
    expect(rowsB).toHaveLength(1);
  });

  it("concurrent creation with the same name — exactly one must succeed", async () => {
    const payload: CreateMissionDTO = {
      ...validMissionBase(),
      name: "Race Condition Mission",
    };

    const results = await Promise.allSettled([
      missionService.createMission({ ...payload }),
      missionService.createMission({ ...payload }),
      missionService.createMission({ ...payload }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(2);

    // Une seule ligne en base
    const rows = await getMissionFromDb(payload.name);
    expect(rows).toHaveLength(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. VALEURS RETOURNÉES PAR LE SERVICE (mapping domain → DTO)
// ══════════════════════════════════════════════════════════════════════════════

describe("Service return value integrity", () => {
  it("must return a mission with a valid UUID (non-null, non-empty)", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name: "UUID Check",
    });
    expect(result.getUuid()).toBeTruthy();
    expect(result.getUuid()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("must return dates that match what was submitted", async () => {
    const dateStart = new Date(Date.now() + 86_400_000).toISOString();
    const dateEnd = new Date(Date.now() + 172_800_000).toISOString();

    const result = await missionService.createMission({
      ...validMissionBase(),
      name: "Date Integrity",
      dateStart,
      dateEnd,
    });

    expect(new Date(result.getDateStart()).toISOString()).toBe(dateStart);
    expect(new Date(result.getDateEnd()).toISOString()).toBe(dateEnd);
  });

  it("must return inscriptions with VALIDATED status for participant organizers", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name: "Inscription Status Check",
      toPublish: true,
      organizers: [
        { organizerUuid: orgaUuidOne, isMain: true, isParticipant: true },
      ],
    });

    const registration = result.getRegistrations()[0]!;
    expect(registration.getStatus()).toBe(2); // Adapte si tu utilises une enum
  });

  it("must match the UUID returned by the service with what is stored in DB", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name: "UUID DB Match",
    });

    const [rows] = await database.execute<RowDataPacket[]>(
      "SELECT mission_uuid FROM mission WHERE mission_name = ?",
      ["UUID DB Match"],
    );
    expect(rows[0]!.mission_uuid).toBe(result.getUuid());
  });

  it("must return correct number of categories on the result object", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name: "Category Count Return",
      categoryIds: [1, 2, 3],
    });

    expect(result.getCategoryIds()).toHaveLength(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. EDGE CASES — LIMITES & VOLUMÉTRIE
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases and boundary values", () => {
  it("must handle nbrVolunteerNeeded = 1 (minimum valid)", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name: "Min Volunteers",
      nbrVolunteerNeeded: 1,
    });
    expect(result.getName()).toBe("Min Volunteers");
  });

  it("must handle a very long but valid description (1000 chars)", async () => {
    const longDesc = "A".repeat(1000);
    const result = await missionService.createMission({
      ...validMissionBase(),
      name: "Long Description",
      description: longDesc,
    });
    expect(result.getName()).toBe("Long Description");
  });

  it("must handle all 4 categories simultaneously", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name: "All Four Categories",
      categoryIds: [1, 2, 3, 4],
    });

    const [rows] = await database.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM mission_category mc
       JOIN mission m ON m.mission_id = mc.id_mission
       WHERE m.mission_uuid = ?`,
      [result.getUuid()],
    );
    expect(rows[0]!.count).toBe(4);
  });

  it("must handle 3 organizers with 3 participant registrations", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name: "Three Participants",
      toPublish: true,
      nbrVolunteerNeeded: 10,
      organizers: [
        { organizerUuid: orgaUuidOne, isMain: true, isParticipant: true },
        { organizerUuid: orgaUuidTwo, isMain: false, isParticipant: true },
        { organizerUuid: orgaUuidThree, isMain: false, isParticipant: true },
      ],
    });

    expect(result.getRegistrations()).toHaveLength(3);

    const inscriptions = await getInscriptionsForMission(result.getUuid());
    expect(inscriptions).toHaveLength(3);
  });

  it("must handle a mission starting exactly tomorrow at midnight", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const result = await missionService.createMission({
      ...validMissionBase(),
      name: "Midnight Mission",
      dateStart: tomorrow.toISOString(),
      dateEnd: dayAfter.toISOString(),
    });

    expect(result.getName()).toBe("Midnight Mission");
  });
});
