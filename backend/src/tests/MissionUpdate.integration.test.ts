import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { EventEmitter } from "node:events";
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
import { UnauthorizedMissionActionError } from "../domain/mission/exceptions/UnauthorizedMissionActionError.js";
import type { IActor } from "../domain/user/IActor.js";
import { UserRole } from "../domain/user/UserRoleEnum.js";
import { HashService } from "../infra/security/HashService.js";

// ─── Shared Fixtures ──────────────────────────────────────────────────────────

let database: Pool;
let missionService: MissionService;

const orgaUuidOne = "user-uuid-1";
const orgaUuidTwo = "user-uuid-2";
const orgaUuidThree = "user-uuid-3";
const hackerUuid = "hacker-uuid-999";

// ─── Actors Mocks ─────────────────────────────────────────────────────────────

const mockMainOrgaActor: IActor = {
  getUuid: () => orgaUuidOne,
  getRole: () => UserRole.ORGANIZER,
};

const mockHackerActor: IActor = {
  getUuid: () => hackerUuid,
  getRole: () => UserRole.VOLUNTEER,
};

const mockSuperAdminActor: IActor = {
  getUuid: () => hackerUuid, // Un admin n'est pas dans l'équipe, mais a les droits
  getRole: () => UserRole.SUPER_ADMIN,
};

// ─── Time helpers ─────────────────────────────────────────────────────────────

const inDays = (n: number) => new Date(Date.now() + 86_400_000 * n).toISOString();
const inPast = (n: number) => new Date(Date.now() - 86_400_000 * n).toISOString();

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

const getOrganizersForMission = async (uuid: string): Promise<RowDataPacket[]> => {
  const [rows] = await database.execute<RowDataPacket[]>(
    `SELECT mo.* FROM mission_organizer mo
     JOIN mission m ON m.mission_id = mo.id_mission
     WHERE m.mission_uuid = ?`,
    [uuid],
  );
  return rows;
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
  }, mockMainOrgaActor); // On utilise l'orga 1 pour créer
  return result.getUuid();
};

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

const resetDatabase = async () => {
  await database.execute("SET FOREIGN_KEY_CHECKS = 0");
  await database.execute("TRUNCATE TABLE registration");
  await database.execute("TRUNCATE TABLE mission_organizer");
  await database.execute("TRUNCATE TABLE mission_category");
  await database.execute("TRUNCATE TABLE mission");
  await database.execute("TRUNCATE TABLE `user`");
  await database.execute("SET FOREIGN_KEY_CHECKS = 1");

  await database.execute("INSERT IGNORE INTO city (city_id, city_name, city_zip) VALUES (1, 'Paris', '75000'), (2, 'Lyon', '69000')");
  await database.execute("INSERT IGNORE INTO role (role_id, role_name) VALUES (1,'SUPER_ADMIN'), (2,'ORGANISATEUR'), (3,'BENEVOLE')");
  await database.execute("INSERT IGNORE INTO mission_status (mission_status_id, mission_status_name) VALUES (1,'DRAFT'), (2,'PUBLISHED'), (3,'FINISHED'), (4,'CANCELED')");
  await database.execute("INSERT IGNORE INTO category (category_id, category_name) VALUES (1,'SPORT'), (2,'Aide'), (3,'Autre')");
  await database.execute("INSERT IGNORE INTO registration_status (registration_status_id, registration_status_name) VALUES (1,'ONHOLD'), (2,'VALIDATED'), (3,'REFUSED'), (4,'CANCELED')");

  const users: [string, string][] = [
    [orgaUuidOne, "o1@test.com"],
    [orgaUuidTwo, "o2@test.com"],
    [orgaUuidThree, "o3@test.com"],
    [hackerUuid, "hacker@test.com"]
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
  const eventBus = new EventEmitter(); // EventBus mocké
  const hashService = new HashService();
  const userRepository = new UserRepository(database);
  const missionRepository = new MissionRepository(database);
  const registrationRepository = new RegistrationRepository(database);
  
  missionService = new MissionService(
    missionRepository,
    registrationRepository,
    userRepository,
    database,
    eventBus
  );
});

afterAll(async () => {
  await Database.getInstance().disconnect();
});

beforeEach(async () => {
  await resetDatabase();
});


// ══════════════════════════════════════════════════════════════════════════════
// PARTIE 1 : UPDATE DETAILS (updateMissionDetails)
// ══════════════════════════════════════════════════════════════════════════════

describe("Update Details - Security & Access", () => {
  it("rejects details update if actor is neither organizer nor admin", async () => {
    const uuid = await createMission();
    await expect(
      missionService.updateMissionDetails({ name: "Hacked" }, uuid, mockHackerActor),
    ).rejects.toThrow(UnauthorizedMissionActionError);
  });

  it("allows details update if actor is SUPER_ADMIN even if not in the team", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMissionDetails({ name: "Admin Edit" }, uuid, mockSuperAdminActor);
    expect(result.getName()).toBe("Admin Edit");
  });
});

describe("Update Details - Basic Fields", () => {
  it("updates ONLY name; all other fields remain identical", async () => {
    const uuid = await createMission();
    const before = await getMissionFromDb(uuid);
    
    const result = await missionService.updateMissionDetails({ name: "Renamed Mission" }, uuid, mockMainOrgaActor);

    expect(result.getName()).toBe("Renamed Mission");
    const after = await getMissionFromDb(uuid);
    expect(after.mission_description).toBe(before.mission_description);
    expect(after.mission_address).toBe(before.mission_address);
  });

  it("updates description and address simultaneously", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMissionDetails(
      { description: "New description", address: "42 avenue" },
      uuid,
      mockMainOrgaActor
    );
    expect(result.getDescription()).toBe("New description");
    expect(result.getAddress()).toBe("42 avenue");
  });

  it("updates categories properly (replaces old with new)", async () => {
    const uuid = await createMission({ categoryIds: [1] });
    await missionService.updateMissionDetails({ categoryIds: [2, 3] }, uuid, mockMainOrgaActor);
    const cats = await getCategoriesForMission(uuid);
    expect(cats.sort()).toEqual([2, 3]);
  });
});

describe("Update Details - Date Invariants", () => {
  it("must reject updating start == end → MissionDateError", async () => {
    const uuid = await createMission();
    const same = inDays(3);
    await expect(
      missionService.updateMissionDetails({ dateStart: same, dateEnd: same }, uuid, mockMainOrgaActor),
    ).rejects.toThrow(MissionDateError);
  });

  it("must reject updating dateStart to a past value → MissionDateError", async () => {
    const uuid = await createMission();
    await expect(
      missionService.updateMissionDetails({ dateStart: inPast(3) }, uuid, mockMainOrgaActor),
    ).rejects.toThrow(MissionDateError);
  });
});

describe("Update Details - Publication via toPublish", () => {
  it("publishes a perfectly valid draft via updateDetails", async () => {
    const uuid = await createMission();
    const result = await missionService.updateMissionDetails(
      { toPublish: true },
      uuid,
      mockMainOrgaActor
    );
    expect(result.getStatus()).toBe(MissionStatus.PUBLISHED);
  });

  it("rejects publish via updateDetails if address is empty", async () => {
    const uuid = await createMission({ address: "" });
    await expect(
      missionService.updateMissionDetails({ toPublish: true }, uuid, mockMainOrgaActor),
    ).rejects.toThrow();
  });
});


// ══════════════════════════════════════════════════════════════════════════════
// PARTIE 2 : UPDATE ORGANIZERS (updateMissionOrganizers)
// ══════════════════════════════════════════════════════════════════════════════

describe("Update Organizers - Security & Access", () => {
  it("rejects organizer update if actor is a secondary organizer (not main)", async () => {
    // Création avec orga 1 (main) et orga 2 (secondaire)
    const uuid = await createMission({
      organizers: [
        { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
        { organizerUuid: orgaUuidTwo, isMain: false, isParticipant: false },
      ]
    });

    const mockSecondaryOrgaActor: IActor = {
      getUuid: () => orgaUuidTwo,
      getRole: () => UserRole.ORGANIZER,
    };

    // Orga 2 essaie de virer Orga 1
    await expect(
      missionService.updateMissionOrganizers({
        organizers: [{ organizerUuid: orgaUuidTwo, isMain: true, isParticipant: false }]
      }, uuid, mockSecondaryOrgaActor)
    ).rejects.toThrow(UnauthorizedMissionActionError);
  });

  it("allows organizer update if actor is SUPER_ADMIN", async () => {
    const uuid = await createMission();
    
    // L'admin remplace l'équipe par l'orga 3
    const result = await missionService.updateMissionOrganizers({
      organizers: [{ organizerUuid: orgaUuidThree, isMain: true, isParticipant: false }]
    }, uuid, mockSuperAdminActor);

    expect(result.getOrganizers()[0]!.organizerUuid).toBe(orgaUuidThree);
  });
});

describe("Update Organizers - Business Rules", () => {
  it("replaces organizer list with a new single organizer", async () => {
    const uuid = await createMission();
    
    await missionService.updateMissionOrganizers({
      organizers: [{ organizerUuid: orgaUuidTwo, isMain: true, isParticipant: false }]
    }, uuid, mockMainOrgaActor);
    
    const dbOrgas = await getOrganizersForMission(uuid);
    expect(dbOrgas).toHaveLength(1);
    expect(dbOrgas[0]!.id_organizer).toBeDefined(); // Test DB basique
  });

  it("rejects an update leaving no main organizer", async () => {
    const uuid = await createMission();
    await expect(
      missionService.updateMissionOrganizers({
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: false, isParticipant: false },
          { organizerUuid: orgaUuidTwo, isMain: false, isParticipant: false },
        ]
      }, uuid, mockMainOrgaActor)
    ).rejects.toThrow();
  });

  it("rejects an update with two main organizers", async () => {
    const uuid = await createMission();
    await expect(
      missionService.updateMissionOrganizers({
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
          { organizerUuid: orgaUuidTwo, isMain: true, isParticipant: false },
        ]
      }, uuid, mockMainOrgaActor)
    ).rejects.toThrow();
  });

  it("adds an organizer as participant and triggers Registration logic", async () => {
    const uuid = await createMission();
    
    const result = await missionService.updateMissionOrganizers({
      organizers: [
        { organizerUuid: orgaUuidOne, isMain: true, isParticipant: true }, // Devient participant !
      ]
    }, uuid, mockMainOrgaActor);

    // L'entité en RAM doit avoir l'inscription. (Le test DB est ignoré car l'EventBus est mocké)
    expect(result.getRegistrations()).toHaveLength(1);
    expect(result.getRegistrations()[0]!.getVolunteerUuid()).toBe(orgaUuidOne);
  });
});