import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type Express } from "express";
import { MissionService } from "../application/MissionService.js";
import type { RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";
import type { CreateMissionDTO } from "../presentation/dto/mission/CreateMissionDTO.js";
import { Database } from "../infra/database/DatabaseConfig.js";
import { HashService } from "../infra/security/HashService.js";
import { TokenService } from "../infra/security/TokenService.js";
import { UserRepository } from "../infra/repositories/UserRepository.js";
import { MissionRepository } from "../infra/repositories/MissionRepository.js";
import { RegistrationRepository } from "../infra/repositories/RegistrationRepository.js";
import { AuthService } from "../application/AuthService.js";
import { AuthController } from "../presentation/AuthController.js";
import { AppConfig } from "../infra/web/AppConfig.js";
import { MissionController } from "../presentation/MissionController.js";
import { MissionDateError } from "../domain/mission/exceptions/MissionDateError.js";
import { MissionStatus } from "../domain/mission/MissionStatusEnum.js";
import { MissionNameAlreadyExistError } from "../domain/mission/exceptions/MissionNameAlreadyExistError.js";

// ─── Fixtures partagées ────────────────────────────────────────────────────────

let app: Express;
let database: Pool;
let missionService: MissionService;

const orgaUuidOne   = "user-uuid-1";
const orgaUuidTwo   = "user-uuid-2";
const orgaUuidThree = "user-uuid-3";

let orgaOneId: number;
let orgaTwoId: number;
let orgaThreeId: number;

// ─── Time helpers (cohérents avec updateMission.test.ts) ──────────────────────

const inDays  = (n: number) => new Date(Date.now() + 86_400_000 * n).toISOString();
const inPast  = (n: number) => new Date(Date.now() - 86_400_000 * n).toISOString();

// ─── DB helpers ───────────────────────────────────────────────────────────────

const getMissionFromDb = async (name: string): Promise<RowDataPacket[]> => {
  const [rows] = await database.execute<RowDataPacket[]>(
    "SELECT * FROM mission WHERE mission_name = ?",
    [name],
  );
  return rows;
};

const getInscriptionsForMission = async (missionUuid: string): Promise<RowDataPacket[]> => {
  const [rows] = await database.execute<RowDataPacket[]>(
    `SELECT i.* FROM inscription i
     JOIN mission m ON m.mission_id = i.id_mission
     WHERE m.mission_uuid = ?`,
    [missionUuid],
  );
  return rows;
};

const getOrganizersForMission = async (missionUuid: string): Promise<RowDataPacket[]> => {
  const [rows] = await database.execute<RowDataPacket[]>(
    `SELECT mo.* FROM mission_organizer mo
     JOIN mission m ON m.mission_id = mo.id_mission
     WHERE m.mission_uuid = ?`,
    [missionUuid],
  );
  return rows;
};

const validMissionBase = (): CreateMissionDTO => ({
  name:               `Mission Test ${Date.now()}`,
  description:        "Description valide pour les tests avancés.",
  dateStart:          inDays(1),
  dateEnd:            inDays(2),
  address:            "14 rue du Test",
  nbrVolunteerNeeded: 5,
  cityId:             1,
  categoryIds:        [1, 2],
  toPublish:          false,
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
    "INSERT IGNORE INTO city (city_id, city_name, city_zip) VALUES (1, 'Paris', '75000'), (2, 'Lyon', '69000'), (3, 'Marseille', '13000')",
  );
  await database.execute(`
    INSERT IGNORE INTO role (role_id, role_name)
    VALUES (1,'SUPER_ADMIN'), (2,'ORGANISATEUR'), (3,'BENEVOLE')`);
  await database.execute(`
    INSERT IGNORE INTO mission_status (mission_status_id, mission_status_name)
    VALUES (1,'DRAFT'), (2,'PUBLISHED'), (3,'FINISHED'), (4,'CANCELED')`);
  await database.execute(`
    INSERT IGNORE INTO category (category_id, category_name)
    VALUES (1,'SPORT'), (2,'Aide et autre'), (3,'Autre catégorie'), (4,'Catégorie de test'), (5,'Culture'), (6,'Environnement')`);
  await database.execute(
    "INSERT IGNORE INTO inscription_status (inscription_status_id, inscription_status_name) VALUES (1,'PENDING'), (2,'VALIDATED'), (3,'REFUSED')",
  );

  const users: [string, string][] = [
    [orgaUuidOne,   "orga1@test.com"],
    [orgaUuidTwo,   "orga2@test.com"],
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

  orgaOneId   = await resolve(orgaUuidOne);
  orgaTwoId   = await resolve(orgaUuidTwo);
  orgaThreeId = await resolve(orgaUuidThree);
};

beforeAll(() => {
  database = Database.getInstance().getPool();

  const hashService          = new HashService();
  const tokenService         = new TokenService();
  const userRepository       = new UserRepository(database);
  const missionRepository    = new MissionRepository(database);
  const registrationRepository = new RegistrationRepository(database);
  const authService          = new AuthService(userRepository, hashService, tokenService);

  missionService = new MissionService(
    missionRepository,
    registrationRepository,
    userRepository,
    database,
  );

  const authController    = new AuthController(authService, tokenService);
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
// 1. DATE INVARIANTS — TOUJOURS APPLIQUÉES (draft ET publication)
//    Règle : passé, start == end, end < start, date malformée → toujours rejeté.
// ══════════════════════════════════════════════════════════════════════════════

describe("Date invariants (always applied — draft or publish)", () => {
  it("must reject a mission whose start date equals the end date", async () => {
    const sameDate = inDays(1);
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        toPublish: false,
        name: "Same Date",
        dateStart: sameDate,
        dateEnd:   sameDate,
      }),
    ).rejects.toThrow(MissionDateError);
  });

  it("must reject a mission with a start date in the past", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        toPublish: false,
        name:      "Past Start",
        dateStart: inPast(3),
        dateEnd:   inDays(1),
      }),
    ).rejects.toThrow(MissionDateError);
  });

  it("must reject a mission with end strictly before start", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        toPublish: false,
        name:      "End Before Start",
        dateStart: inDays(3),
        dateEnd:   inDays(1),
      }),
    ).rejects.toThrow(MissionDateError);
  });

  it("must reject a malformed date string", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        toPublish: false,
        name:      "Malformed Date",
        dateStart: "not-a-valid-date",
      }),
    ).rejects.toThrow();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. MODEL INVARIANTS — TOUJOURS APPLIQUÉES (draft ET publication)
//    Règle : ces champs sont toujours obligatoires / bornés, statut ignoré.
// ══════════════════════════════════════════════════════════════════════════════

describe("Model invariants (always applied — draft or publish)", () => {
  it("must reject an empty name", async () => {
    await expect(
      missionService.createMission({ ...validMissionBase(), toPublish: false, name: "" }),
    ).rejects.toThrow();
  });

  it("must reject a name that is only whitespace", async () => {
    await expect(
      missionService.createMission({ ...validMissionBase(), toPublish: false, name: "   " }),
    ).rejects.toThrow();
  });

  it("must reject a name exceeding maximum length (255 chars)", async () => {
    await expect(
      missionService.createMission({ ...validMissionBase(), toPublish: false, name: "A".repeat(256) }),
    ).rejects.toThrow();
  });

  it("must reject a negative nbrVolunteerNeeded", async () => {
    await expect(
      missionService.createMission({ ...validMissionBase(), toPublish: false, name: "Negative Vol", nbrVolunteerNeeded: -5 }),
    ).rejects.toThrow();
  });

  it("must reject an empty organizer list", async () => {
    await expect(
      missionService.createMission({ ...validMissionBase(), toPublish: false, name: "No Organizer", organizers: [] }),
    ).rejects.toThrow();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. DRAFT INVARIANTS — RÈGLES PERMISSIVES
//    Ces champs sont facultatifs sur un brouillon ; ils seront requis à la
//    publication (voir section 4).
// ══════════════════════════════════════════════════════════════════════════════

describe("Draft invariants (Permissive rules)", () => {
  it("must ACCEPT a draft with missing description", async () => {
    const { description, ...baseWithoutDesc } = validMissionBase();
    const result = await missionService.createMission({
      ...baseWithoutDesc,
      toPublish: false,
      name: "Draft No Desc",
    });
    expect(result.getStatus()).toBe(MissionStatus.DRAFT);
  });

  it("must ACCEPT a draft with nbrVolunteerNeeded = 0", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      toPublish:          false,
      name:               "Draft Zero Vol",
      nbrVolunteerNeeded: 0,
    });
    expect(result.getNbrVolunteerNeeded()).toBe(0);
  });

  it("must ACCEPT a draft with no categories", async () => {
    const { categoryIds, ...baseWithoutCats } = validMissionBase();
    const result = await missionService.createMission({
      ...baseWithoutCats,
      toPublish: false,
      name:      "Draft No Categories",
    });
    expect(result.getCategoryIds()).toHaveLength(0);
  });

  it("must ACCEPT a draft without an address", async () => {
    const { address, ...baseWithoutAddr } = validMissionBase();
    const result = await missionService.createMission({
      ...baseWithoutAddr,
      toPublish: false,
      name:      "Draft No Address",
    });
    expect(result.getStatus()).toBe(MissionStatus.DRAFT);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. PUBLICATION INVARIANTS — RÈGLES STRICTES SUPPLÉMENTAIRES
//    Ces règles s'ajoutent aux invariants universels lors d'une publication.
// ══════════════════════════════════════════════════════════════════════════════

describe("Publication invariants (Strict rules)", () => {
  it("must reject nbrVolunteerNeeded = 0 on publish", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        toPublish:          true,
        name:               "Zero Volunteers Publish",
        nbrVolunteerNeeded: 0,
      }),
    ).rejects.toThrow();
  });

  it("must reject an empty description on publish", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        toPublish:   true,
        name:        "Empty Desc Publish",
        description: "",
      }),
    ).rejects.toThrow();
  });

  it("must reject a missing address on publish", async () => {
    const { address, ...baseWithoutAddr } = validMissionBase();
    await expect(
      missionService.createMission({
        ...baseWithoutAddr,
        toPublish: true,
        name:      "No Address Publish",
      }),
    ).rejects.toThrow();
  });

  it("must reject an empty category list on publish", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        toPublish:   true,
        name:        "No Category Publish",
        categoryIds: [],
      }),
    ).rejects.toThrow();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. ORGANIZER BUSINESS RULES
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
    ).rejects.toThrow();
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
    ).rejects.toThrow();
  });

  it("must reject a duplicate organizer UUID in the same list", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name: "Duplicate Orga",
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true,  isParticipant: false },
          { organizerUuid: orgaUuidOne, isMain: false, isParticipant: true },
        ],
      }),
    ).rejects.toThrow();
  });

  it("must reject an organizer with an empty UUID", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name: "Empty Orga UUID",
        organizers: [{ organizerUuid: "", isMain: true, isParticipant: false }],
      }),
    ).rejects.toThrow();
  });

  it("must NOT create an inscription for a non-participant organizer", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name: "Orga Non Participant",
      organizers: [{ organizerUuid: orgaUuidOne, isMain: true, isParticipant: false }],
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
        { organizerUuid: orgaUuidOne, isMain: true,  isParticipant: false },
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
// 6. STATUTS & PUBLICATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Mission status rules", () => {
  it("must create with DRAFT status when toPublish is false, even with a participant", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name:      "Draft With Participant",
      toPublish: false,
      organizers: [{ organizerUuid: orgaUuidOne, isMain: true, isParticipant: true }],
    });

    expect(result.getStatus()).toBe(MissionStatus.DRAFT);
    expect(result.getRegistrations()).toHaveLength(1);
  });

  it("must store PUBLISHED status in DB when toPublish is true", async () => {
    await missionService.createMission({
      ...validMissionBase(),
      name:      "Published In DB",
      toPublish: true,
      organizers: [{ organizerUuid: orgaUuidOne, isMain: true, isParticipant: false }],
    });

    const rows = await getMissionFromDb("Published In DB");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.id_mission_status).toBe(2); // 2 = PUBLISHED
  });

  it("must store DRAFT status in DB when toPublish is false", async () => {
    await missionService.createMission({
      ...validMissionBase(),
      name:      "Draft In DB",
      toPublish: false,
    });

    const rows = await getMissionFromDb("Draft In DB");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.id_mission_status).toBe(1); // 1 = DRAFT
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. CATÉGORIES
// ══════════════════════════════════════════════════════════════════════════════

describe("Mission categories", () => {
  it("must persist all categories in mission_category table", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name:        "All Categories",
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

  it("must reject a non-existent category (FK constraint) and rollback", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name:        "Bad Category",
        categoryIds: [9999],
      }),
    ).rejects.toThrow();

    const rows = await getMissionFromDb("Bad Category");
    expect(rows).toHaveLength(0);
  });

  it("must reject duplicate categoryIds in the same mission", async () => {
    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name:        "Duplicate Cat",
        categoryIds: [1, 1, 2],
      }),
    ).rejects.toThrow();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. TRANSACTIONS & ROLLBACKS
// ══════════════════════════════════════════════════════════════════════════════

describe("Transaction integrity (rollbacks)", () => {
  it("ROLLBACK: must not persist the mission if category saving fails mid-transaction", async () => {
    const name = "Mission Category Rollback";

    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name,
        categoryIds: [1, 9999],
        organizers:  [{ organizerUuid: orgaUuidOne, isMain: true, isParticipant: false }],
      }),
    ).rejects.toThrow();

    const rows = await getMissionFromDb(name);
    expect(rows).toHaveLength(0);
  });

  it("ROLLBACK: must not persist the mission if organizer saving fails mid-transaction", async () => {
    const name = "Mission Organizer Rollback";

    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name,
        organizers: [{ organizerUuid: "uuid-fantome", isMain: true, isParticipant: false }],
      }),
    ).rejects.toThrow();

    const rows = await getMissionFromDb(name);
    expect(rows).toHaveLength(0);
  });

  it("ROLLBACK: partial organizers — second organizer fails, first should not be saved", async () => {
    const name = "Mission Partial Orga Rollback";

    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name,
        organizers: [
          { organizerUuid: orgaUuidOne,   isMain: true,  isParticipant: false },
          { organizerUuid: "uuid-fantome", isMain: false, isParticipant: false },
        ],
      }),
    ).rejects.toThrow();

    const rows = await getMissionFromDb(name);
    expect(rows).toHaveLength(0);

    const [orgas] = await database.execute<RowDataPacket[]>(
      "SELECT * FROM mission_organizer WHERE id_mission = (SELECT mission_id FROM mission WHERE mission_name = ? LIMIT 1)",
      [name],
    );
    expect(orgas).toHaveLength(0);
  });

  it("ROLLBACK: second inscription fails → mission AND first inscription rolled back", async () => {
    const name = "Mission Double Inscription Rollback";

    await expect(
      missionService.createMission({
        ...validMissionBase(),
        name,
        toPublish: true,
        organizers: [
          { organizerUuid: orgaUuidOne,   isMain: true,  isParticipant: true },
          { organizerUuid: "uuid-fantome", isMain: false, isParticipant: true },
        ],
      }),
    ).rejects.toThrow();

    const rows = await getMissionFromDb(name);
    expect(rows).toHaveLength(0);

    const [inscriptions] = await database.execute<RowDataPacket[]>(
      "SELECT * FROM inscription WHERE id_user = ?",
      [orgaOneId],
    );
    expect(inscriptions).toHaveLength(0);
  });

  it("must not leave orphan data after any failed creation (invalid cityId)", async () => {
    const name = "Orphan Check";

    await expect(
      missionService.createMission({ ...validMissionBase(), name, cityId: 9999 }),
    ).rejects.toThrow();

    const [missions]     = await database.execute<RowDataPacket[]>("SELECT COUNT(*) as c FROM mission WHERE mission_name = ?", [name]);
    const [categories]   = await database.execute<RowDataPacket[]>("SELECT COUNT(*) as c FROM mission_category");
    const [organizers]   = await database.execute<RowDataPacket[]>("SELECT COUNT(*) as c FROM mission_organizer");
    const [inscriptions] = await database.execute<RowDataPacket[]>("SELECT COUNT(*) as c FROM inscription");

    expect(missions[0]!.c).toBe(0);
    expect(categories[0]!.c).toBe(0);
    expect(organizers[0]!.c).toBe(0);
    expect(inscriptions[0]!.c).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. IDEMPOTENCE & CONCURRENCE
// ══════════════════════════════════════════════════════════════════════════════

describe("Idempotency and concurrency", () => {
  it("must reject the second call when two missions with the same name are created sequentially", async () => {
    const payload: CreateMissionDTO = { ...validMissionBase(), name: "Mission Sequential Duplicate" };

    await missionService.createMission(payload);

    await expect(missionService.createMission(payload)).rejects.toThrow(MissionNameAlreadyExistError);

    const rows = await getMissionFromDb(payload.name);
    expect(rows).toHaveLength(1);
  });

  it("must handle creation of two missions with different names without interference", async () => {
    const r1 = await missionService.createMission({ ...validMissionBase(), name: "Sequential A" });
    const r2 = await missionService.createMission({ ...validMissionBase(), name: "Sequential B" });

    expect(r1.getName()).toBe("Sequential A");
    expect(r2.getName()).toBe("Sequential B");

    expect(await getMissionFromDb("Sequential A")).toHaveLength(1);
    expect(await getMissionFromDb("Sequential B")).toHaveLength(1);
  });

  it("concurrent creation with the same name — exactly one must succeed", async () => {
    const payload: CreateMissionDTO = { ...validMissionBase(), name: "Race Condition Mission" };

    const results = await Promise.allSettled([
      missionService.createMission({ ...payload }),
      missionService.createMission({ ...payload }),
      missionService.createMission({ ...payload }),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(2);

    const rows = await getMissionFromDb(payload.name);
    expect(rows).toHaveLength(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. VALEURS RETOURNÉES PAR LE SERVICE (mapping domain → objet)
// ══════════════════════════════════════════════════════════════════════════════

describe("Service return value integrity", () => {
  it("must return a mission with a valid UUID (non-null, non-empty)", async () => {
    const result = await missionService.createMission({ ...validMissionBase(), name: "UUID Check" });
    expect(result.getUuid()).toBeTruthy();
    expect(result.getUuid()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("must return dates that match what was submitted", async () => {
    const dateStart = inDays(1);
    const dateEnd   = inDays(2);

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
      name:      "Inscription Status Check",
      toPublish: true,
      organizers: [{ organizerUuid: orgaUuidOne, isMain: true, isParticipant: true }],
    });

    const registration = result.getRegistrations()[0]!;
    expect(registration.getStatus()).toBe(2); // 2 = VALIDATED
  });

  it("must match the UUID returned by the service with what is stored in DB", async () => {
    const result = await missionService.createMission({ ...validMissionBase(), name: "UUID DB Match" });

    const [rows] = await database.execute<RowDataPacket[]>(
      "SELECT mission_uuid FROM mission WHERE mission_name = ?",
      ["UUID DB Match"],
    );
    expect(rows[0]!.mission_uuid).toBe(result.getUuid());
  });

  it("must return correct number of categories on the result object", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name:        "Category Count Return",
      categoryIds: [1, 2, 3],
    });
    expect(result.getCategoryIds()).toHaveLength(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. EDGE CASES — LIMITES & VOLUMÉTRIE
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases and boundary values", () => {
  it("must handle nbrVolunteerNeeded = 1 (minimum valid on publish)", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name:               "Min Volunteers",
      nbrVolunteerNeeded: 1,
    });
    expect(result.getName()).toBe("Min Volunteers");
  });

  it("must handle a large but valid nbrVolunteerNeeded (99 999)", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name:               "Max Volunteers",
      nbrVolunteerNeeded: 99_999,
    });
    expect(result.getNbrVolunteerNeeded()).toBe(99_999);
  });

  it("must handle a very long but valid description (1000 chars)", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name:        "Long Description",
      description: "A".repeat(1000),
    });
    expect(result.getName()).toBe("Long Description");
  });

  it("must securely handle SQL injection attempts in text fields", async () => {
    const sneakyString = "Robert'; DROP TABLE mission;--";
    const result = await missionService.createMission({
      ...validMissionBase(),
      name:        sneakyString,
      description: sneakyString,
    });
    expect(result.getName()).toBe(sneakyString);

    const rows = await getMissionFromDb(sneakyString);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.mission_description).toBe(sneakyString);
  });

  it("must handle all available categories simultaneously", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name:        "All Six Categories",
      categoryIds: [1, 2, 3, 4, 5, 6],
    });

    const [rows] = await database.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM mission_category mc
       JOIN mission m ON m.mission_id = mc.id_mission
       WHERE m.mission_uuid = ?`,
      [result.getUuid()],
    );
    expect(rows[0]!.count).toBe(6);
  });

  it("must handle 3 organizers with 3 participant registrations", async () => {
    const result = await missionService.createMission({
      ...validMissionBase(),
      name:               "Three Participants",
      toPublish:          true,
      nbrVolunteerNeeded: 10,
      organizers: [
        { organizerUuid: orgaUuidOne,   isMain: true,  isParticipant: true },
        { organizerUuid: orgaUuidTwo,   isMain: false, isParticipant: true },
        { organizerUuid: orgaUuidThree, isMain: false, isParticipant: true },
      ],
    });

    expect(result.getRegistrations()).toHaveLength(3);
    expect(await getInscriptionsForMission(result.getUuid())).toHaveLength(3);
  });

  it("must handle a mission starting exactly tomorrow at midnight", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const result = await missionService.createMission({
      ...validMissionBase(),
      name:      "Midnight Mission",
      dateStart: tomorrow.toISOString(),
      dateEnd:   dayAfter.toISOString(),
    });
    expect(result.getName()).toBe("Midnight Mission");
  });
});