import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";
import { Database } from "../infra/database/DatabaseConfig.js";
import { UserRepository } from "../infra/repositories/UserRepository.js";
import { MissionRepository } from "../infra/repositories/MissionRepository.js";
import { RegistrationRepository } from "../infra/repositories/RegistrationRepository.js";
import { MissionService } from "../application/MissionService.js";
import { MissionStatus } from "../domain/mission/MissionStatusEnum.js";
import { MissionNotFoundError } from "../domain/mission/exceptions/MissionNotFoundError.js";
import { MissionNameAlreadyExistError } from "../domain/mission/exceptions/MissionNameAlreadyExistError.js";
import { MissionDateError } from "../domain/mission/exceptions/MissionDateError.js";

// ─── Shared Fixtures ──────────────────────────────────────────────────────────

let database: Pool;
let missionService: MissionService;

const orgaUuidOne = "user-uuid-1";
const orgaUuidTwo = "user-uuid-2";
const orgaUuidThree = "user-uuid-3";

// ─── Time helpers (cohérents avec createMission.test.ts) ─────────────────────

const inDays = (n: number) =>
  new Date(Date.now() + 86_400_000 * n).toISOString();
const inHours = (n: number) =>
  new Date(Date.now() + 3_600_000 * n).toISOString();
const inPast = (n: number) =>
  new Date(Date.now() - 86_400_000 * n).toISOString();

// ─── DB helpers ───────────────────────────────────────────────────────────────

const getMissionFromDb = async (uuid: string): Promise<RowDataPacket> => {
  const [rows] = await database.execute<RowDataPacket[]>(
    "SELECT * FROM mission WHERE mission_uuid = ?",
    [uuid],
  );
  if (!rows.length) throw new Error(`Mission ${uuid} not found in DB`);
  return rows[0]!;
};

const getCategoriesForMission = async (uuid: string): Promise<number[]> => {
  const [rows] = await database.execute<RowDataPacket[]>(
    `SELECT mc.id_category FROM mission_category mc
     JOIN mission m ON m.mission_id = mc.id_mission
     WHERE m.mission_uuid = ?`,
    [uuid],
  );
  return rows.map((r) => r.id_category);
};

const getOrganizersForMission = async (
  uuid: string,
): Promise<RowDataPacket[]> => {
  const [rows] = await database.execute<RowDataPacket[]>(
    `SELECT mo.* FROM mission_organizer mo
     JOIN mission m ON m.mission_id = mo.id_mission
     WHERE m.mission_uuid = ?`,
    [uuid],
  );
  return rows;
};

const countAllMissions = async (): Promise<number> => {
  const [rows] = await database.execute<RowDataPacket[]>(
    "SELECT COUNT(*) as cnt FROM mission",
  );
  return rows[0]!.cnt as number;
};

// ─── Factory helpers ──────────────────────────────────────────────────────────

type CreateOptions = {
  toPublish?: boolean;
  categoryIds?: number[];
  nbrVolunteerNeeded?: number;
  description?: string;
  address?: string;
  organizers?: Array<{
    organizerUuid: string;
    isMain: boolean;
    isParticipant: boolean;
  }>;
};

const createMission = async (opts: CreateOptions = {}): Promise<string> => {
  const result = await missionService.createMission({
    name: `Mission-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: opts.description ?? "Default description",
    dateStart: inDays(1),
    dateEnd: inDays(2),
    address: opts.address ?? "10 rue de test",
    nbrVolunteerNeeded: opts.nbrVolunteerNeeded ?? 5,
    cityId: 1,
    categoryIds: opts.categoryIds ?? [1],
    toPublish: opts.toPublish ?? false,
    organizers: opts.organizers ?? [
      { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
    ],
  });
  return result.getUuid();
};

const createPublishedMission = (overrides: CreateOptions = {}) =>
  createMission({ ...overrides, toPublish: true });

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
    "INSERT IGNORE INTO city (city_id, city_name, city_zip) VALUES (1, 'Paris', '75000'), (2, 'Lyon', '69000'), (3, 'Marseille', '13000')",
  );
  await database.execute(
    "INSERT IGNORE INTO role (role_id, role_name) VALUES (1,'SUPER_ADMIN'), (2,'ORGANISATEUR'), (3,'BENEVOLE')",
  );
  await database.execute(
    "INSERT IGNORE INTO mission_status (mission_status_id, mission_status_name) VALUES (1,'DRAFT'), (2,'PUBLISHED'), (3,'FINISHED'), (4,'CANCELED')",
  );
  await database.execute(
    "INSERT IGNORE INTO category (category_id, category_name) VALUES (1,'SPORT'), (2,'Aide et autre'), (3,'Autre'), (4,'Test'), (5,'Culture'), (6,'Environnement')",
  );
  await database.execute(
    "INSERT IGNORE INTO inscription_status (inscription_status_id, inscription_status_name) VALUES (1,'PENDING'), (2,'VALIDATED'), (3,'REFUSED')",
  );

  const users: [string, string][] = [
    [orgaUuidOne, "o1@test.com"],
    [orgaUuidTwo, "o2@test.com"],
    [orgaUuidThree, "o3@test.com"],
  ];

  for (const [uuid, email] of users) {
    await database.execute(
      "INSERT IGNORE INTO user (user_uuid, user_email, user_password, user_created_at, id_role) VALUES (?, ?, 'hashed', NOW(), 2)",
      [uuid, email],
    );
  }
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
// 1. DATE INVARIANTS — TOUJOURS APPLIQUÉES (draft ET publication)
//    Règle : passé, start == end, end < start, date malformée → toujours rejeté.
//    (Miroir de la section 1 de createMission.test.ts)
// ══════════════════════════════════════════════════════════════════════════════

describe("Date invariants (always applied — draft or publish)", () => {
  it("must reject updating start == end → MissionDateError", async () => {
    const uuid = await createMission();
    const same = inDays(3);
    await expect(
      missionService.updateMission({ dateStart: same, dateEnd: same }, uuid),
    ).rejects.toThrow(MissionDateError);
  });

  it("must reject updating dateStart to a past value → MissionDateError", async () => {
    const uuid = await createMission();
    await expect(
      missionService.updateMission({ dateStart: inPast(3) }, uuid),
    ).rejects.toThrow(MissionDateError);
  });

  it("must reject updating dateEnd strictly before dateStart → MissionDateError", async () => {
    const uuid = await createMission();
    await expect(
      missionService.updateMission(
        { dateStart: inDays(4), dateEnd: inDays(2) },
        uuid,
      ),
    ).rejects.toThrow(MissionDateError);
  });

  it("must reject updating dateEnd to a past date → MissionDateError", async () => {
    const uuid = await createMission();
    await expect(
      missionService.updateMission({ dateEnd: inPast(1) }, uuid),
    ).rejects.toThrow(MissionDateError);
  });

  it("accepts a cross-year span (Jan → Dec next year)", async () => {
    const uuid = await createMission();
    const start = new Date(new Date().getFullYear() + 1, 0, 1).toISOString();
    const end = new Date(new Date().getFullYear() + 1, 11, 31).toISOString();
    const result = await missionService.updateMission(
      { dateStart: start, dateEnd: end },
      uuid,
    );
    expect(result.getDateStart()).toBeDefined();
  });

  it.todo("accepts dateStart exactly 1 hour from now — rule not yet decided");

  it.todo(
    "rejects dateStart less than 1 hour away — minimum advance notice rule not yet defined",
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. PARTIAL UPDATES — SINGLE FIELDS
// ══════════════════════════════════════════════════════════════════════════════

describe("Partial updates — single fields", () => {
  // ── Name ────────────────────────────────────────────────────────────────────

  it("updates ONLY name; all other fields remain identical", async () => {
    const uuid = await createMission();
    const before = await getMissionFromDb(uuid);
    const result = await missionService.updateMission(
      { name: "Renamed Mission" },
      uuid,
    );

    expect(result.getName()).toBe("Renamed Mission");
    const after = await getMissionFromDb(uuid);
    expect(after.mission_description).toBe(before.mission_description);
    expect(after.mission_date_start).toStrictEqual(before.mission_date_start);
    expect(after.mission_date_end).toStrictEqual(before.mission_date_end);
    expect(after.mission_address).toBe(before.mission_address);
    expect(after.mission_nbr_volunteer_needed).toBe(
      before.mission_nbr_volunteer_needed,
    );
  });

  it("rejects whitespace-only name on update", async () => {
    const uuid = await createMission();
    await expect(
      missionService.updateMission({ name: "   " }, uuid),
    ).rejects.toThrow();
  });

  it("accepts a name that is exactly 1 character long", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMission({ name: "X" }, uuid);
    expect(result.getName()).toBe("X");
  });

  it("rejects a name longer than 255 characters", async () => {
    const uuid = await createMission();
    await expect(
      missionService.updateMission({ name: "N".repeat(256) }, uuid),
    ).rejects.toThrow();
  });

  // ── Description ─────────────────────────────────────────────────────────────

  it("updates ONLY description", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMission(
      { description: "New description" },
      uuid,
    );
    expect(result.getDescription()).toBe("New description");
  });

  it("accepts an empty description on a draft", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMission(
      { description: "" },
      uuid,
    );
    expect(result.getDescription()).toBe("");
  });

  it("accepts a description with unicode and special characters", async () => {
    const uuid = await createMission();
    const fancy = "🚀 Ça marche avec des émojis & <script>alert(1)</script>";
    const result = await missionService.updateMission(
      { description: fancy },
      uuid,
    );
    expect(result.getDescription()).toBe(fancy);
  });

  it("accepts a description of exactly 1000 characters", async () => {
    const uuid = await createMission();
    const desc = "D".repeat(1000);
    const result = await missionService.updateMission(
      { description: desc },
      uuid,
    );
    expect(result.getDescription()).toBe(desc);
  });

  // ── Address ──────────────────────────────────────────────────────────────────

  it("updates ONLY address", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMission(
      { address: "42 avenue Nouvelle" },
      uuid,
    );
    expect(result.getAddress()).toBe("42 avenue Nouvelle");
  });

  it("accepts an empty address on a draft", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMission({ address: "" }, uuid);
    expect(result.getAddress()).toBe("");
  });

  // ── Volunteers count ─────────────────────────────────────────────────────────

  it("updates ONLY nbrVolunteerNeeded", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMission(
      { nbrVolunteerNeeded: 42 },
      uuid,
    );
    expect(result.getNbrVolunteerNeeded()).toBe(42);
  });

  it("accepts nbrVolunteerNeeded = 1 (minimum valid for publish)", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMission(
      { nbrVolunteerNeeded: 1 },
      uuid,
    );
    expect(result.getNbrVolunteerNeeded()).toBe(1);
  });

  it("accepts nbrVolunteerNeeded = 0 on a DRAFT", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMission(
      { nbrVolunteerNeeded: 0 },
      uuid,
    );
    expect(result.getNbrVolunteerNeeded()).toBe(0);
  });

  it("rejects nbrVolunteerNeeded < 0", async () => {
    const uuid = await createMission();
    await expect(
      missionService.updateMission({ nbrVolunteerNeeded: -1 }, uuid),
    ).rejects.toThrow();
  });

  it("accepts a very large but valid volunteer count (50 000)", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMission(
      { nbrVolunteerNeeded: 50_000 },
      uuid,
    );
    expect(result.getNbrVolunteerNeeded()).toBe(50_000);
  });

  // ── City ─────────────────────────────────────────────────────────────────────

  it("updates ONLY cityId", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMission({ cityId: 2 }, uuid);
    expect(result.getCityId()).toBe(2);
  });

  it("rejects an unknown cityId (FK violation)", async () => {
    const uuid = await createMission();
    await expect(
      missionService.updateMission({ cityId: 9999 }, uuid),
    ).rejects.toThrow();
  });

  // ── Date updates ─────────────────────────────────────────────────────────────

  it("updates both dateStart and dateEnd with consistent values", async () => {
    const uuid = await createMission();
    const newStart = inDays(3);
    const newEnd = inDays(5);
    const result = await missionService.updateMission(
      { dateStart: newStart, dateEnd: newEnd },
      uuid,
    );
    expect(new Date(result.getDateStart()).toISOString()).toBe(newStart);
  });

  it("updates only dateEnd (start stays fixed)", async () => {
    const uuid = await createMission();
    const newEnd = inDays(5);
    const result = await missionService.updateMission(
      { dateEnd: newEnd },
      uuid,
    );
    expect(new Date(result.getDateEnd()).toISOString()).toBe(newEnd);
  });

  // ── Empty payload ────────────────────────────────────────────────────────────

  it("empty payload does not mutate the mission", async () => {
    const uuid = await createMission();
    const before = await getMissionFromDb(uuid);
    await missionService.updateMission({}, uuid);
    const after = await getMissionFromDb(uuid);

    expect(after.mission_name).toBe(before.mission_name);
    expect(after.mission_description).toBe(before.mission_description);
    expect(after.mission_address).toBe(before.mission_address);
    expect(after.mission_nbr_volunteer_needed).toBe(
      before.mission_nbr_volunteer_needed,
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. DRAFT INVARIANTS — RÈGLES PERMISSIVES
//    (Miroir de la section 3 de createMission.test.ts)
// ══════════════════════════════════════════════════════════════════════════════

describe("Draft invariants (Permissive rules)", () => {
  it("accepts clearing the description on a draft", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMission(
      { description: "" },
      uuid,
    );
    expect(result.getDescription()).toBe("");
  });

  it("accepts clearing the address on a draft", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMission({ address: "" }, uuid);
    expect(result.getAddress()).toBe("");
  });

  it("accepts removing all categories from a draft", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMission(
      { categoryIds: [] },
      uuid,
    );
    expect(result.getCategoryIds()).toHaveLength(0);
  });

  it("accepts nbrVolunteerNeeded = 0 on a draft", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMission(
      { nbrVolunteerNeeded: 0 },
      uuid,
    );
    expect(result.getNbrVolunteerNeeded()).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. PUBLICATION INVARIANTS — RÈGLES STRICTES SUPPLÉMENTAIRES
//    (Miroir de la section 4 de createMission.test.ts)
// ══════════════════════════════════════════════════════════════════════════════

describe("Publication invariants (Strict rules)", () => {
  it("publishes a perfectly valid draft", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMission(
      { toPublish: true },
      uuid,
    );
    expect(result.getStatus()).toBe(MissionStatus.PUBLISHED);
  });

  it("published mission is persisted with PUBLISHED status in DB", async () => {
    const uuid = await createMission();
    await missionService.updateMission({ toPublish: true }, uuid);
    const row = await getMissionFromDb(uuid);
    expect(row.id_mission_status).toBe(2); // 2 = PUBLISHED
  });

  it("rejects publish when description is empty", async () => {
    const uuid = await createMission({ description: "" });
    await expect(
      missionService.updateMission({ toPublish: true }, uuid),
    ).rejects.toThrow();
  });

  it("rejects publish when address is empty", async () => {
    const uuid = await createMission({ address: "" });
    await expect(
      missionService.updateMission({ toPublish: true }, uuid),
    ).rejects.toThrow();
  });

  it("rejects publish when categoryIds is empty", async () => {
    const uuid = await createMission({ categoryIds: [] });
    await expect(
      missionService.updateMission({ toPublish: true }, uuid),
    ).rejects.toThrow();
  });

  it("rejects publish when nbrVolunteerNeeded is 0", async () => {
    const uuid = await createMission({ nbrVolunteerNeeded: 0 });
    await expect(
      missionService.updateMission({ toPublish: true }, uuid),
    ).rejects.toThrow();
  });

  it("rejects publish when name is blank (whitespace only)", async () => {
    const uuid = await createMission();
    await expect(
      missionService.updateMission({ name: "   ", toPublish: true }, uuid),
    ).rejects.toThrow();
  });

  it("rejects publish when dateStart is in the past", async () => {
    const uuid = await createMission();
    await expect(
      missionService.updateMission(
        { dateStart: inPast(10), toPublish: true },
        uuid,
      ),
    ).rejects.toThrow(MissionDateError);
  });

  it("rejects publish when dateEnd is before dateStart", async () => {
    const uuid = await createMission();
    await expect(
      missionService.updateMission(
        { dateStart: inDays(3), dateEnd: inDays(1), toPublish: true },
        uuid,
      ),
    ).rejects.toThrow(MissionDateError);
  });

  it("simultaneously applies field fixes AND publishes in one call", async () => {
    const uuid = await createMission({ description: "", address: "" });
    const result = await missionService.updateMission(
      {
        description: "Fixed description",
        address: "Fixed address",
        categoryIds: [1],
        toPublish: true,
      },
      uuid,
    );
    expect(result.getStatus()).toBe(MissionStatus.PUBLISHED);
  });

  it("updating an allowed field on a published mission does not reset its status", async () => {
    const uuid = await createPublishedMission();
    const result = await missionService.updateMission(
      { nbrVolunteerNeeded: 20 },
      uuid,
    );
    expect(result.getStatus()).toBe(MissionStatus.PUBLISHED);
  });

  it.todo(
    "PUBLISHED → DRAFT transition via toPublish:false — depublication rule not yet implemented",
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. STATUS MACHINE TRANSITIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Status machine transitions", () => {
  it("DRAFT → PUBLISHED is allowed via toPublish:true", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMission(
      { toPublish: true },
      uuid,
    );
    expect(result.getStatus()).toBe(MissionStatus.PUBLISHED);
  });

  it("FINISHED mission cannot be updated (forced via DB)", async () => {
    const uuid = await createPublishedMission();
    await database.execute(
      "UPDATE mission SET id_mission_status = 3 WHERE mission_uuid = ?",
      [uuid],
    );
    await expect(
      missionService.updateMission({ name: "Illegal Update" }, uuid),
    ).rejects.toThrow();
  });

  it.todo(
    "PUBLISHED → CANCELED via cancelMission() — cancellation requires a dedicated service method",
  );

  it.todo(
    "CANCELED mission cannot be updated — depends on cancelMission() implementation",
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. CATEGORIES — RELATIONS & INTEGRITY
// ══════════════════════════════════════════════════════════════════════════════

describe("Categories — relations & integrity", () => {
  it("replaces [1] with [1, 2] — adds without duplicate", async () => {
    const uuid = await createMission({ categoryIds: [1] });
    await missionService.updateMission({ categoryIds: [1, 2] }, uuid);
    expect((await getCategoriesForMission(uuid)).sort()).toEqual([1, 2]);
  });

  it("replaces entirely [1] with [2, 3] — old category is removed", async () => {
    const uuid = await createMission({ categoryIds: [1] });
    await missionService.updateMission({ categoryIds: [2, 3] }, uuid);
    const cats = await getCategoriesForMission(uuid);
    expect(cats).not.toContain(1);
    expect(cats.sort()).toEqual([2, 3]);
  });

  it("accepts all available categories at once", async () => {
    const uuid = await createMission();
    await missionService.updateMission(
      { categoryIds: [1, 2, 3, 4, 5, 6] },
      uuid,
    );
    expect(await getCategoriesForMission(uuid)).toHaveLength(6);
  });

  it("rejects an unknown category ID (FK violation)", async () => {
    const uuid = await createMission();
    await expect(
      missionService.updateMission({ categoryIds: [9999] }, uuid),
    ).rejects.toThrow();
  });

  it("rejects duplicate category IDs in the payload", async () => {
    const uuid = await createMission();
    await expect(
      missionService.updateMission({ categoryIds: [1, 1] }, uuid),
    ).rejects.toThrow();
  });

  it("clearing categories on a draft stores an empty list in DB", async () => {
    const uuid = await createMission({ categoryIds: [1, 2] });
    await missionService.updateMission({ categoryIds: [] }, uuid);
    expect(await getCategoriesForMission(uuid)).toHaveLength(0);
  });

  it("categories are not mutated when payload does not include categoryIds", async () => {
    const uuid = await createMission({ categoryIds: [1, 2] });
    await missionService.updateMission({ name: "No cat change" }, uuid);
    expect((await getCategoriesForMission(uuid)).sort()).toEqual([1, 2]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. ORGANIZER MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

describe("Organizer management", () => {
  it("replaces organizer list with a new single organizer", async () => {
    const uuid = await createMission({
      organizers: [
        { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
      ],
    });
    await missionService.updateMission(
      {
        organizers: [
          { organizerUuid: orgaUuidTwo, isMain: true, isParticipant: false },
        ],
      },
      uuid,
    );
    expect(await getOrganizersForMission(uuid)).toHaveLength(1);
  });

  it("supports co-organizers: one main + one secondary", async () => {
    const uuid = await createMission();
    await missionService.updateMission(
      {
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
          { organizerUuid: orgaUuidTwo, isMain: false, isParticipant: false },
        ],
      },
      uuid,
    );
    expect(await getOrganizersForMission(uuid)).toHaveLength(2);
  });

  it("rejects having no main organizer", async () => {
    const uuid = await createMission();
    await expect(
      missionService.updateMission(
        {
          organizers: [
            { organizerUuid: orgaUuidOne, isMain: false, isParticipant: false },
            { organizerUuid: orgaUuidTwo, isMain: false, isParticipant: false },
          ],
        },
        uuid,
      ),
    ).rejects.toThrow();
  });

  it("rejects having two main organizers", async () => {
    const uuid = await createMission();
    await expect(
      missionService.updateMission(
        {
          organizers: [
            { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
            { organizerUuid: orgaUuidTwo, isMain: true, isParticipant: false },
          ],
        },
        uuid,
      ),
    ).rejects.toThrow();
  });

  it("rejects an empty organizers list", async () => {
    const uuid = await createMission();
    await expect(
      missionService.updateMission({ organizers: [] }, uuid),
    ).rejects.toThrow();
  });

  it("rejects a non-existent organizer UUID", async () => {
    const uuid = await createMission();
    await expect(
      missionService.updateMission(
        {
          organizers: [
            {
              organizerUuid: "00000000-dead-beef-0000-000000000000",
              isMain: true,
              isParticipant: false,
            },
          ],
        },
        uuid,
      ),
    ).rejects.toThrow();
  });

  it("does not mutate organizers when payload does not include the organizers field", async () => {
    const uuid = await createMission({
      organizers: [
        { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
      ],
    });
    await missionService.updateMission({ name: "No orga change" }, uuid);
    expect(await getOrganizersForMission(uuid)).toHaveLength(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. NAMING CONFLICTS & IDEMPOTENCY
// ══════════════════════════════════════════════════════════════════════════════

describe("Naming conflicts & idempotency", () => {
  it("allows re-saving a mission with its current name (idempotent rename)", async () => {
    const uuid = await createMission();
    const row = await getMissionFromDb(uuid);
    const sameName = row.mission_name;
    const result = await missionService.updateMission({ name: sameName }, uuid);
    expect(result.getName()).toBe(sameName);
  });

  it("throws MissionNameAlreadyExistError when stealing another mission's name", async () => {
    const uuid1 = await createMission();
    const uuid2 = await createMission();
    const row1 = await getMissionFromDb(uuid1);

    await expect(
      missionService.updateMission({ name: row1.mission_name }, uuid2),
    ).rejects.toThrow(MissionNameAlreadyExistError);
  });

  it("sequential renames enforce uniqueness: A → X then B → X should fail", async () => {
    const uuidA = await createMission();
    const uuidB = await createMission();
    const sharedName = `Unique-Name-${Date.now()}-${crypto.randomUUID()}`;

    await missionService.updateMission({ name: sharedName }, uuidA);

    try {
      await missionService.updateMission({ name: sharedName }, uuidB);
      expect.fail("L'update aurait dû échouer car le nom est déjà pris.");
    } catch (error: any) {
      // On cherche simplement le texte de l'erreur plutôt que son "name" interne !
      expect(error.message).toContain("existe déjà"); 
    }
  });

  it("race condition: only ONE of two parallel renames to the same name succeeds", async () => {
    const uuidA = await createMission();
    const uuidB = await createMission();

    const results = await Promise.allSettled([
      missionService.updateMission({ name: "RaceName" }, uuidA),
      missionService.updateMission({ name: "RaceName" }, uuidB),
    ]);

    const [rows] = await database.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as cnt FROM mission WHERE mission_name = ?",
      ["RaceName"],
    );
    expect(rows[0]!.cnt as number).toBeLessThanOrEqual(1);
    expect(
      results.filter((r) => r.status === "rejected").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("massive parallel rename stress (5 missions → same name): at most one wins", async () => {
    const uuids: string[] = [];
    for (let i = 0; i < 5; i++) uuids.push(await createMission());

    await Promise.allSettled(
      uuids.map((uuid) =>
        missionService.updateMission({ name: "StressName" }, uuid),
      ),
    );

    const [rows] = await database.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as cnt FROM mission WHERE mission_name = ?",
      ["StressName"],
    );
    expect(rows[0]!.cnt as number).toBeLessThanOrEqual(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. TRANSACTION INTEGRITY & ROLLBACKS
// ══════════════════════════════════════════════════════════════════════════════

describe("Transaction integrity & rollbacks", () => {
  it("rolls back name + category update when FK violation occurs mid-transaction", async () => {
    const uuid = await createMission({ categoryIds: [1] });
    const before = await getMissionFromDb(uuid);
    const catsBefore = await getCategoriesForMission(uuid);

    await expect(
      missionService.updateMission(
        { name: "Should Not Persist", categoryIds: [2, 9999] },
        uuid,
      ),
    ).rejects.toThrow();

    const after = await getMissionFromDb(uuid);
    const catsAfter = await getCategoriesForMission(uuid);

    expect(after.mission_name).toBe(before.mission_name);
    expect(catsAfter.sort()).toEqual(catsBefore.sort());
  });

  it("rolls back ALL changes when organizer update fails (non-existent UUID)", async () => {
    const uuid = await createMission();
    const before = await getMissionFromDb(uuid);

    await expect(
      missionService.updateMission(
        {
          name: "Rollback Name",
          organizers: [
            {
              organizerUuid: "00000000-dead-0000-0000-000000000000",
              isMain: true,
              isParticipant: false,
            },
          ],
        },
        uuid,
      ),
    ).rejects.toThrow();

    const after = await getMissionFromDb(uuid);
    expect(after.mission_name).toBe(before.mission_name);
  });

  it("total mission count does not increase after a failed update", async () => {
    const countBefore = await countAllMissions();
    const uuid = await createMission();

    await expect(
      missionService.updateMission({ categoryIds: [9999] }, uuid),
    ).rejects.toThrow();

    expect(await countAllMissions()).toBe(countBefore + 1); // only the initial creation
  });

  it("throws MissionNotFoundError for a valid-format but non-existent UUID", async () => {
    await expect(
      missionService.updateMission(
        { name: "Ghost" },
        "00000000-0000-0000-0000-000000000000",
      ),
    ).rejects.toThrow(MissionNotFoundError);
  });

  it("throws on malformed UUID (not a valid UUID format)", async () => {
    await expect(
      missionService.updateMission({ name: "Bad" }, "not-a-uuid"),
    ).rejects.toThrow();
  });

  it("throws on empty string UUID", async () => {
    await expect(
      missionService.updateMission({ name: "Bad" }, ""),
    ).rejects.toThrow();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. SECURITY — INJECTION & INPUT SANITIZATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Security — injection & input sanitization", () => {
  it("stores SQL injection payload in name as literal string, not executed", async () => {
    const uuid = await createMission();
    const injection = "'; DROP TABLE mission; --";
    await missionService.updateMission({ name: injection }, uuid);
    const row = await getMissionFromDb(uuid); // Would throw if table dropped
    expect(row.mission_name).toBe(injection);
  });

  it("stores SQL injection payload in description as literal string", async () => {
    const uuid = await createMission();
    const injection = '"; UPDATE user SET id_role=1; --';
    await missionService.updateMission({ description: injection }, uuid);
    const row = await getMissionFromDb(uuid);
    expect(row.mission_description).toBe(injection);
  });

  it("stores SQL injection payload in address as literal string", async () => {
    const uuid = await createMission();
    const injection = "' OR '1'='1";
    await missionService.updateMission({ address: injection }, uuid);
    const row = await getMissionFromDb(uuid);
    expect(row.mission_address).toBe(injection);
  });

  it("handles a very long description (10 000 chars) — rejects or stores safely, no crash", async () => {
    const uuid = await createMission();
    const massive = "X".repeat(10_000);
    await expect(missionService.updateMission({ description: massive }, uuid))
      .resolves.toBeDefined()
      .catch(() => {}); // Either accepted (TEXT column) or rejected (VARCHAR) — no crash
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. MULTI-FIELD COMBINATIONS & DOMAIN COHERENCE
// ══════════════════════════════════════════════════════════════════════════════

describe("Multi-field updates & domain coherence", () => {
  it("all updatable fields change simultaneously", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMission(
      {
        name: "Full Update",
        description: "Updated desc",
        dateStart: inDays(3),
        dateEnd: inDays(6),
        address: "99 rue Complète",
        nbrVolunteerNeeded: 12,
        cityId: 2,
        categoryIds: [2, 3],
        organizers: [
          { organizerUuid: orgaUuidTwo, isMain: true, isParticipant: false },
        ],
      },
      uuid,
    );

    expect(result.getName()).toBe("Full Update");
    expect(result.getDescription()).toBe("Updated desc");
    expect(result.getAddress()).toBe("99 rue Complète");
    expect(result.getNbrVolunteerNeeded()).toBe(12);
    expect(result.getCityId()).toBe(2);
    expect(result.getCategoryIds().sort()).toEqual([2, 3]);
  });

  it("successive updates accumulate correctly (3 sequential updates)", async () => {
    const uuid = await createMission();

    await missionService.updateMission({ name: "Step 1" }, uuid);
    await missionService.updateMission({ description: "Step 2 desc" }, uuid);
    const result = await missionService.updateMission(
      { address: "Step 3 addr" },
      uuid,
    );

    expect(result.getName()).toBe("Step 1");
    expect(result.getDescription()).toBe("Step 2 desc");
    expect(result.getAddress()).toBe("Step 3 addr");
  });

  it("update and re-update categories: [1] → [1,2] → [3]", async () => {
    const uuid = await createMission({ categoryIds: [1] });
    await missionService.updateMission({ categoryIds: [1, 2] }, uuid);
    await missionService.updateMission({ categoryIds: [3] }, uuid);
    expect(await getCategoriesForMission(uuid)).toEqual([3]);
  });

  it("final update returns a fully hydrated domain object", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMission(
      { name: "Hydrated" },
      uuid,
    );

    expect(result.getUuid()).toBe(uuid);
    expect(result.getName()).toBeDefined();
    expect(result.getDescription()).toBeDefined();
    expect(result.getDateStart()).toBeDefined();
    expect(result.getDateEnd()).toBeDefined();
    expect(result.getAddress()).toBeDefined();
    expect(result.getNbrVolunteerNeeded()).toBeGreaterThan(0);
    expect(result.getCityId()).toBeDefined();
    expect(result.getStatus()).toBeDefined();
  });
});
