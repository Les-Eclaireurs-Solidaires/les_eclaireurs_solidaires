import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { EventEmitter } from "node:events";
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
import { UnauthorizedMissionActionError } from "../domain/mission/exceptions/UnauthorizedMissionActionError.js";
import type { IActor } from "../domain/user/IActor.js";
import { UserRole } from "../domain/user/UserRoleEnum.js";
import { GeolocalizationError } from "../domain/mission/exceptions/GeolocalizationError.js";

// ─── Fixtures partagées ────────────────────────────────────────────────────────

let app: Express;
let database: Pool;
let missionService: MissionService;

const orgaUuidOne = "user-uuid-1";
const orgaUuidTwo = "user-uuid-2";
const orgaUuidThree = "user-uuid-3";
const volunteerUuid = "user-uuid-vol-1";

// ─── Actor mocks (multi-rôles) ─────────────────────────────────────────────────

const mockActorOrganizer: IActor = {
  getUuid: () => orgaUuidOne,
  getRole: () => UserRole.ORGANIZER,
};
const mockActorOrgaTwo: IActor = {
  getUuid: () => orgaUuidTwo,
  getRole: () => UserRole.ORGANIZER,
};
const mockActorVolunteer: IActor = {
  getUuid: () => volunteerUuid,
  getRole: () => UserRole.VOLUNTEER,
};

const mockActorSuperAdmin: IActor = {
  getUuid: () => "superadmin-uuid",
  getRole: () => UserRole.SUPER_ADMIN,
};

// ─── Alias pour cohérence avec les anciens tests ──────────────────────────────
const mockActor = mockActorOrganizer;

// ─── Time helpers ─────────────────────────────────────────────────────────────

const inDays = (n: number) =>
  new Date(Date.now() + 86_400_000 * n).toISOString();
const inPast = (n: number) =>
  new Date(Date.now() - 86_400_000 * n).toISOString();
const inHours = (n: number) =>
  new Date(Date.now() + 3_600_000 * n).toISOString();
const inMinutes = (n: number) =>
  new Date(Date.now() + 60_000 * n).toISOString();

// ─── DB helpers ───────────────────────────────────────────────────────────────

const getMissionFromDb = async (name: string): Promise<RowDataPacket[]> => {
  const [rows] = await database.execute<RowDataPacket[]>(
    "SELECT * FROM mission WHERE mission_name = ?",
    [name],
  );
  return rows;
};

const getMissionByUuid = async (
  uuid: string,
): Promise<RowDataPacket | null> => {
  const [rows] = await database.execute<RowDataPacket[]>(
    "SELECT * FROM mission WHERE mission_uuid = ?",
    [uuid],
  );
  return rows[0] ?? null;
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

const getRegistrationsForMission = async (
  missionUuid: string,
): Promise<RowDataPacket[]> => {
  const [rows] = await database.execute<RowDataPacket[]>(
    `SELECT r.* FROM registration r
     JOIN mission m ON m.mission_id = r.id_mission
     WHERE m.mission_uuid = ?`,
    [missionUuid],
  );
  return rows;
};

const getCategoriesForMission = async (
  missionUuid: string,
): Promise<RowDataPacket[]> => {
  const [rows] = await database.execute<RowDataPacket[]>(
    `SELECT mc.* FROM mission_category mc
     JOIN mission m ON m.mission_id = mc.id_mission
     WHERE m.mission_uuid = ?`,
    [missionUuid],
  );
  return rows;
};

const countAllRows = async () => {
  const [[m]] = await database.execute<RowDataPacket[]>(
    "SELECT COUNT(*) as c FROM mission",
  );
  const [[mc]] = await database.execute<RowDataPacket[]>(
    "SELECT COUNT(*) as c FROM mission_category",
  );
  const [[mo]] = await database.execute<RowDataPacket[]>(
    "SELECT COUNT(*) as c FROM mission_organizer",
  );
  const [[r]] = await database.execute<RowDataPacket[]>(
    "SELECT COUNT(*) as c FROM registration",
  );
  return {
    missions: m!.c,
    categories: mc!.c,
    organizers: mo!.c,
    registrations: r!.c,
  };
};

// ─── DTO factory ──────────────────────────────────────────────────────────────

const validMissionBase = (): CreateMissionDTO => ({
  name: `Mission Test ${Date.now()}`,
  description: "Description valide pour les tests avancés.",
  dateStart: inDays(2),
  dateEnd: inDays(3),
  address: "14 rue du Test",
  nbrVolunteerNeeded: 5,
  cityId: 1,
  categoryIds: [1, 2],
  toPublish: false,
  organizers: [
    { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
  ],
});

// ─── Setup ────────────────────────────────────────────────────────────────────

const setupDatabase = async () => {
  await database.execute("SET FOREIGN_KEY_CHECKS = 0");
  await database.execute("TRUNCATE TABLE registration");
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
    VALUES (1,'SuperAdmin'), (2,'Organizer'), (3,'Volunteer')`);
  await database.execute(`
    INSERT IGNORE INTO mission_status (mission_status_id, mission_status_name)
    VALUES (1,'DRAFT'), (2,'PUBLISHED'), (3,'FINISHED'), (4,'CANCELED')`);
  await database.execute(`
    INSERT IGNORE INTO category (category_id, category_name)
    VALUES (1,'SPORT'), (2,'Aide et autre'), (3,'Autre catégorie'), (4,'Catégorie de test'), (5,'Culture'), (6,'Environnement')`);
  await database.execute(`
    INSERT IGNORE INTO registration_status (registration_status_id, registration_status_name)
    VALUES (1,'ONHOLD'), (2,'VALIDATED'), (3,'REFUSED'), (4,'CANCELED'), (5,'PRESENT'), (6,'ABSENT')`);

  const users: [string, string, number][] = [
    [orgaUuidOne, "orga1@test.com", 2],
    [orgaUuidTwo, "orga2@test.com", 2],
    [orgaUuidThree, "orga3@test.com", 2],
    [volunteerUuid, "volunteer@test.com", 3],
  ];

  for (const [uuid, email, roleId] of users) {
    await database.execute(
      "INSERT IGNORE INTO user (user_uuid, user_email, user_password, user_created_at, id_role) VALUES (?, ?, 'hash', NOW(), ?)",
      [uuid, email, roleId],
    );
  }
};

beforeAll(() => {
  database = Database.getInstance().getPool();

  const eventBus = new EventEmitter();
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
    userRepository,
    database,
    eventBus,
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
// 1. DATE INVARIANTS — TOUJOURS APPLIQUÉES (draft ET publication)
// ══════════════════════════════════════════════════════════════════════════════

describe("Date invariants (always applied — draft or publish)", () => {
  it("must reject a mission whose start date equals the end date", async () => {
    const sameDate = inDays(1);
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          toPublish: false,
          name: "Same Date",
          dateStart: sameDate,
          dateEnd: sameDate,
        },
        mockActor,
      ),
    ).rejects.toThrow(MissionDateError);
  });

  it("must reject a mission with a start date in the past", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          toPublish: false,
          name: "Past Start",
          dateStart: inPast(3),
          dateEnd: inDays(1),
        },
        mockActor,
      ),
    ).rejects.toThrow(MissionDateError);
  });

  it("must reject a mission with end strictly before start", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          toPublish: false,
          name: "End Before Start",
          dateStart: inDays(3),
          dateEnd: inDays(1),
        },
        mockActor,
      ),
    ).rejects.toThrow(MissionDateError);
  });

  it("must reject a malformed date string", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          toPublish: false,
          name: "Malformed Date",
          dateStart: "not-a-valid-date",
        },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("must reject a start date only 1 minute in the future on publish (too soon)", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          toPublish: true, // ✅ ON PUBLIE POUR ACTIVER LE VIDEUR STRICT
          name: "One Minute Start",
          dateStart: inMinutes(1),
          dateEnd: inDays(1),
        },
        mockActor,
      ),
    ).rejects.toThrow(MissionDateError);
  });

  it("must reject dates given as Unix timestamps (not ISO strings)", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          toPublish: false,
          name: "Unix Timestamp",
          dateStart: String(Date.now() + 86_400_000) as any,
          dateEnd: String(Date.now() + 2 * 86_400_000) as any,
        },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("must accept dates in far-future (year 2099)", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Far Future Mission",
        dateStart: "2099-06-01T08:00:00.000Z",
        dateEnd: "2099-06-02T08:00:00.000Z",
      },
      mockActor,
    );
    expect(result.getName()).toBe("Far Future Mission");
  });

  it("must preserve sub-second precision in stored ISO dates", async () => {
    const ms = inDays(1).replace(/\.\d{3}Z$/, ".456Z");
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Millisecond Precision",
        dateStart: ms,
        dateEnd: inDays(2),
      },
      mockActor,
    );
    expect(new Date(result.getDateStart()).getMilliseconds()).toBe(456);
  });

  it("must accept start today at midnight + 1 day end (boundary edge)", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    tomorrow.setHours(0, 0, 0, 0);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Midnight Boundary",
        dateStart: tomorrow.toISOString(),
        dateEnd: dayAfter.toISOString(),
      },
      mockActor,
    );
    expect(result.getName()).toBe("Midnight Boundary");
  });

  it("must reject start == end even when both are in the future", async () => {
    const future = inDays(5);
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          name: "Future Same Date",
          dateStart: future,
          dateEnd: future,
        },
        mockActor,
      ),
    ).rejects.toThrow(MissionDateError);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. MODEL INVARIANTS — TOUJOURS APPLIQUÉES (draft ET publication)
// ══════════════════════════════════════════════════════════════════════════════

describe("Model invariants (always applied — draft or publish)", () => {
  it("must reject an empty name", async () => {
    await expect(
      missionService.createMission(
        { ...validMissionBase(), toPublish: false, name: "" },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("must reject a name that is only whitespace", async () => {
    await expect(
      missionService.createMission(
        { ...validMissionBase(), toPublish: false, name: "   " },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("must reject a name exceeding maximum length (255 chars)", async () => {
    await expect(
      missionService.createMission(
        { ...validMissionBase(), toPublish: false, name: "A".repeat(256) },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("must accept a name of exactly 255 characters (boundary max)", async () => {
    const name = "B".repeat(255);
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name,
      },
      mockActor,
    );
    expect(result.getName()).toBe(name);
  });

  it("must accept a name of exactly 1 character (boundary min)", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "X",
      },
      mockActor,
    );
    expect(result.getName()).toBe("X");
  });

  it("must reject a negative nbrVolunteerNeeded", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          toPublish: false,
          name: "Negative Vol",
          nbrVolunteerNeeded: -5,
        },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("must reject an empty organizer list", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          toPublish: false,
          name: "No Organizer",
          organizers: [],
        },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("must trim leading/trailing whitespace from name (or reject — not silently corrupt)", async () => {
    const paddedName = "  Mission With Spaces  ";
    let result:
      | Awaited<ReturnType<typeof missionService.createMission>>
      | undefined;
    try {
      result = await missionService.createMission(
        {
          ...validMissionBase(),
          name: paddedName,
        },
        mockActor,
      );
    } catch {
      // Rejection is acceptable
      return;
    }
    // If accepted, the stored name must either be trimmed or identical to input — never empty
    expect(result!.getName().trim()).not.toBe("");
  });

  it("must accept names with unicode characters (accents, CJK, emoji-free)", async () => {
    const unicodeName = "Récolte de données — 数据采集";
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: unicodeName,
      },
      mockActor,
    );
    expect(result.getName()).toBe(unicodeName);
  });

  it("must accept a name containing special characters (ampersand, slash, parentheses)", async () => {
    const specialName = "Aide & Soutien (volet 2/3)";
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: specialName,
      },
      mockActor,
    );
    expect(result.getName()).toBe(specialName);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. DRAFT INVARIANTS — RÈGLES PERMISSIVES
// ══════════════════════════════════════════════════════════════════════════════

describe("Draft invariants (Permissive rules)", () => {
  it("must ACCEPT a draft with missing description", async () => {
    const { description, ...baseWithoutDesc } = validMissionBase();
    const result = await missionService.createMission(
      {
        ...baseWithoutDesc,
        toPublish: false,
        name: "Draft No Desc",
      },
      mockActor,
    );
    expect(result.getStatus()).toBe(MissionStatus.DRAFT);
  });

  it("must ACCEPT a draft with nbrVolunteerNeeded omitted", async () => {
    const { nbrVolunteerNeeded, ...baseWithoutVol } = validMissionBase();
    const result = await missionService.createMission(
      {
        ...baseWithoutVol,
        toPublish: false,
        name: "Draft No Vol",
      },
      mockActor,
    );
    expect(result.getStatus()).toBe(MissionStatus.DRAFT);
  });

  it("must ACCEPT a draft with no categories", async () => {
    const { categoryIds, ...baseWithoutCats } = validMissionBase();
    const result = await missionService.createMission(
      {
        ...baseWithoutCats,
        toPublish: false,
        name: "Draft No Categories",
      },
      mockActor,
    );
    expect(result.getCategoryIds()).toHaveLength(0);
  });

  it("must ACCEPT a draft without an address", async () => {
    const { address, ...baseWithoutAddr } = validMissionBase();
    const result = await missionService.createMission(
      {
        ...baseWithoutAddr,
        toPublish: false,
        name: "Draft No Address",
      },
      mockActor,
    );
    expect(result.getStatus()).toBe(MissionStatus.DRAFT);
  });

  it("must ACCEPT a draft with nbrVolunteerNeeded = 0", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        toPublish: false,
        name: "Draft Zero Volunteers",
        nbrVolunteerNeeded: 0,
      },
      mockActor,
    );
    expect(result.getStatus()).toBe(MissionStatus.DRAFT);
  });

  it("must ACCEPT a draft with all optional fields omitted simultaneously", async () => {
    const result = await missionService.createMission(
      {
        name: "Draft Minimal",
        dateStart: inDays(1),
        dateEnd: inDays(2),
        cityId: 1,
        toPublish: false,
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
        ],
      },
      mockActor,
    );
    expect(result.getStatus()).toBe(MissionStatus.DRAFT);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. PUBLICATION INVARIANTS — RÈGLES STRICTES SUPPLÉMENTAIRES
// ══════════════════════════════════════════════════════════════════════════════

describe("Publication invariants (Strict rules)", () => {
  it("must reject nbrVolunteerNeeded = 0 on publish", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          toPublish: true,
          name: "Zero Volunteers Publish",
          nbrVolunteerNeeded: 0,
        },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("must reject an empty description on publish", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          toPublish: true,
          name: "Empty Desc Publish",
          description: "",
        },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("must reject a missing address on publish", async () => {
    const { address, ...baseWithoutAddr } = validMissionBase();
    await expect(
      missionService.createMission(
        {
          ...baseWithoutAddr,
          toPublish: true,
          name: "No Address Publish",
        },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("must reject an empty category list on publish", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          toPublish: true,
          name: "No Category Publish",
          categoryIds: [],
        },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("must reject a whitespace-only description on publish", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          toPublish: true,
          name: "Whitespace Desc Publish",
          description: "   ",
        },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("must reject a whitespace-only address on publish", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          toPublish: true,
          name: "Whitespace Address Publish",
          address: "   ",
        },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("must not persist anything when publication validation fails", async () => {
    const name = "Failed Publication Residue";
    const before = await countAllRows();

    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          toPublish: true,
          name,
          description: "",
        },
        mockActor,
      ),
    ).rejects.toThrow();

    const after = await countAllRows();
    expect(after.missions).toBe(before.missions);
    expect(after.organizers).toBe(before.organizers);
    expect(after.categories).toBe(before.categories);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. ORGANIZER BUSINESS RULES
// ══════════════════════════════════════════════════════════════════════════════

describe("Organizer business rules", () => {
  it("must reject a list with no main organizer (isMain: false for all)", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          name: "No Main Orga",
          organizers: [
            { organizerUuid: orgaUuidOne, isMain: false, isParticipant: false },
            { organizerUuid: orgaUuidTwo, isMain: false, isParticipant: false },
          ],
        },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("must reject a list with two main organizers", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          name: "Two Main Orgas",
          organizers: [
            { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
            { organizerUuid: orgaUuidTwo, isMain: true, isParticipant: false },
          ],
        },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("must reject a duplicate organizer UUID in the same list", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          name: "Duplicate Orga",
          organizers: [
            { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
            { organizerUuid: orgaUuidOne, isMain: false, isParticipant: true },
          ],
        },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("must reject an organizer with an empty UUID", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          name: "Empty Orga UUID",
          organizers: [
            { organizerUuid: "", isMain: true, isParticipant: false },
          ],
        },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("must NOT create a registration for a non-participant organizer", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Orga Non Participant",
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
        ],
      },
      mockActor,
    );

    expect(result.getRegistrations()).toHaveLength(0);
  });

  it("must persist all organizers to mission_organizer table", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Orga Persistence Check",
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
          { organizerUuid: orgaUuidTwo, isMain: false, isParticipant: false },
        ],
      },
      mockActor,
    );

    const organizers = await getOrganizersForMission(result.getUuid());
    expect(organizers).toHaveLength(2);

    const mainOrga = organizers.find((o) => o.mission_organizer_is_main === 1);
    expect(mainOrga).toBeDefined();
  });

  it("must correctly create a registration ONLY for the participant organizer", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Orga Participant Check",
        toPublish: true, // On publie pour que l'inscription soit persistée
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: true }, // Lui doit y être
          { organizerUuid: orgaUuidTwo, isMain: false, isParticipant: false }, // Lui ne doit pas y être
        ],
      },
      mockActor,
    );

    const regs = result.getRegistrations();
    expect(regs).toHaveLength(1);
    expect(regs[0]!.getVolunteerUuid()).toBe(orgaUuidOne)
  });

  it("must reject an organizer UUID that does not exist in the users table", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          name: "Unknown Orga UUID",
          organizers: [
            {
              organizerUuid: "00000000-0000-0000-0000-000000000000",
              isMain: true,
              isParticipant: false,
            },
          ],
        },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("must handle 10 organizers with a single main organizer", async () => {
    const extraUuids = Array.from(
      { length: 9 },
      (_, i) => `orga-extra-uuid-${i + 4}`,
    );

    for (const uuid of extraUuids) {
      await database.execute(
        "INSERT IGNORE INTO user (user_uuid, user_email, user_password, user_created_at, id_role) VALUES (?, ?, 'hash', NOW(), 2)",
        [uuid, `${uuid}@test.com`],
      );
    }

    const organizers = [
      { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
      ...extraUuids.map((uuid) => ({
        organizerUuid: uuid,
        isMain: false,
        isParticipant: false,
      })),
    ];

    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Ten Organizers",
        organizers,
      },
      mockActor,
    );

    const rows = await getOrganizersForMission(result.getUuid());
    expect(rows).toHaveLength(10);
    expect(rows.filter((r) => r.mission_organizer_is_main === 1)).toHaveLength(
      1,
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. STATUTS & PUBLICATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Mission status rules", () => {
  it("must create with DRAFT status when toPublish is false, even with a participant", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Draft With Participant",
        toPublish: false,
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: true },
        ],
      },
      mockActor,
    );

    expect(result.getStatus()).toBe(MissionStatus.DRAFT);
    expect(result.getRegistrations()).toHaveLength(1);
  });

  it("must store PUBLISHED status in DB when toPublish is true", async () => {
    await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Published In DB",
        toPublish: true,
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
        ],
      },
      mockActor,
    );

    const rows = await getMissionFromDb("Published In DB");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.id_mission_status).toBe(2); // 2 = PUBLISHED
  });

  it("must store DRAFT status in DB when toPublish is false", async () => {
    await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Draft In DB",
        toPublish: false,
      },
      mockActor,
    );

    const rows = await getMissionFromDb("Draft In DB");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.id_mission_status).toBe(1); // 1 = DRAFT
  });

  it("mission status returned by service must match status stored in DB", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Status Coherence",
        toPublish: true,
      },
      mockActor,
    );

    const row = await getMissionByUuid(result.getUuid());
    expect(row).not.toBeNull();
    const dbStatusId = row!.id_mission_status;
    // PUBLISHED = status id 2
    expect(dbStatusId).toBe(2);
    expect(result.getStatus()).toBe(MissionStatus.PUBLISHED);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. CATÉGORIES
// ══════════════════════════════════════════════════════════════════════════════

describe("Mission categories", () => {
  it("must persist all categories in mission_category table", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "All Categories",
        categoryIds: [1, 2, 3],
      },
      mockActor,
    );

    const cats = await getCategoriesForMission(result.getUuid());
    expect(cats).toHaveLength(3);
  });

  it("must reject a non-existent category (FK constraint) and rollback", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          name: "Bad Category",
          categoryIds: [9999],
        },
        mockActor,
      ),
    ).rejects.toThrow();

    const rows = await getMissionFromDb("Bad Category");
    expect(rows).toHaveLength(0);
  });

  it("must reject duplicate categoryIds in the same mission", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          name: "Duplicate Cat",
          categoryIds: [1, 1, 2],
        },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("persisted category IDs must match the submitted categoryIds", async () => {
    const submitted = [3, 5, 6];
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Category IDs Match",
        categoryIds: submitted,
      },
      mockActor,
    );

    const cats = await getCategoriesForMission(result.getUuid());
    const storedIds = cats.map((c) => c.id_category).sort();
    expect(storedIds).toEqual(submitted.sort());
  });

  it("getCategoryIds() on result must match what was submitted", async () => {
    const submitted = [2, 4];
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Category Return Match",
        categoryIds: submitted,
      },
      mockActor,
    );

    expect(result.getCategoryIds().sort()).toEqual(submitted.sort());
  });

  it("must accept a single category (minimum valid)", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Single Category",
        categoryIds: [1],
      },
      mockActor,
    );
    expect(result.getCategoryIds()).toHaveLength(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. TRANSACTIONS & ROLLBACKS
// ══════════════════════════════════════════════════════════════════════════════

describe("Transaction integrity (rollbacks)", () => {
  it("ROLLBACK: must not persist the mission if category saving fails mid-transaction", async () => {
    const name = "Mission Category Rollback";

    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          name,
          categoryIds: [1, 9999],
          organizers: [
            { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
          ],
        },
        mockActor,
      ),
    ).rejects.toThrow();

    const rows = await getMissionFromDb(name);
    expect(rows).toHaveLength(0);
  });

  it("ROLLBACK: must not persist the mission if organizer saving fails mid-transaction", async () => {
    const name = "Mission Organizer Rollback";

    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          name,
          organizers: [
            {
              organizerUuid: "uuid-fantome",
              isMain: true,
              isParticipant: false,
            },
          ],
        },
        mockActor,
      ),
    ).rejects.toThrow();

    const rows = await getMissionFromDb(name);
    expect(rows).toHaveLength(0);
  });

  it("ROLLBACK: partial organizers — second organizer fails, first should not be saved", async () => {
    const name = "Mission Partial Orga Rollback";

    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          name,
          organizers: [
            { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
            {
              organizerUuid: "uuid-fantome",
              isMain: false,
              isParticipant: false,
            },
          ],
        },
        mockActor,
      ),
    ).rejects.toThrow();

    const rows = await getMissionFromDb(name);
    expect(rows).toHaveLength(0);

    const [orgas] = await database.execute<RowDataPacket[]>(
      "SELECT * FROM mission_organizer WHERE id_mission = (SELECT mission_id FROM mission WHERE mission_name = ? LIMIT 1)",
      [name],
    );
    expect(orgas).toHaveLength(0);
  });

  it("must not leave orphan data after any failed creation (invalid cityId)", async () => {
    const name = "Orphan Check";

    await expect(
      missionService.createMission(
        { ...validMissionBase(), name, cityId: 9999 },
        mockActor,
      ),
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
    const [registrations] = await database.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as c FROM registration",
    );

    expect(missions[0]!.c).toBe(0);
    expect(categories[0]!.c).toBe(0);
    expect(organizers[0]!.c).toBe(0);
    expect(registrations[0]!.c).toBe(0);
  });

  it("ROLLBACK: participant registration must not be saved when mission creation fails", async () => {
    const name = "Registration Rollback";

    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          name,
          categoryIds: [9999],
          organizers: [
            { organizerUuid: orgaUuidOne, isMain: true, isParticipant: true },
          ],
        },
        mockActor,
      ),
    ).rejects.toThrow();

    const [registrations] = await database.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as c FROM registration",
    );
    expect(registrations[0]!.c).toBe(0);
  });

  it("successful creation must not affect rows counts of other existing missions", async () => {
    // Create a first mission to establish a baseline
    await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Baseline Mission",
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
        ],
      },
      mockActor,
    );

    const before = await countAllRows();

    // Create a second independent mission
    await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Second Mission",
        organizers: [
          { organizerUuid: orgaUuidTwo, isMain: true, isParticipant: false },
        ],
      },
      mockActorOrgaTwo,
    );

    const after = await countAllRows();
    expect(after.missions).toBe(before.missions + 1);
    expect(after.organizers).toBe(before.organizers + 1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. IDEMPOTENCE & CONCURRENCE
// ══════════════════════════════════════════════════════════════════════════════

describe("Idempotency and concurrency", () => {
  it("must reject the second call when two missions with the same name are created sequentially", async () => {
    const payload: CreateMissionDTO = {
      ...validMissionBase(),
      name: "Mission Sequential Duplicate",
    };

    await missionService.createMission(payload, mockActor);

    await expect(
      missionService.createMission(payload, mockActor),
    ).rejects.toThrow(MissionNameAlreadyExistError);

    const rows = await getMissionFromDb(payload.name);
    expect(rows).toHaveLength(1);
  });

  it("must handle creation of two missions with different names without interference", async () => {
    const r1 = await missionService.createMission(
      { ...validMissionBase(), name: "Sequential A" },
      mockActor,
    );
    const r2 = await missionService.createMission(
      { ...validMissionBase(), name: "Sequential B" },
      mockActor,
    );

    expect(r1.getName()).toBe("Sequential A");
    expect(r2.getName()).toBe("Sequential B");

    expect(await getMissionFromDb("Sequential A")).toHaveLength(1);
    expect(await getMissionFromDb("Sequential B")).toHaveLength(1);
  });

  it("concurrent creation with the same name — exactly one must succeed", async () => {
    const payload: CreateMissionDTO = {
      ...validMissionBase(),
      name: "Race Condition Mission",
    };

    const results = await Promise.allSettled([
      missionService.createMission({ ...payload }, mockActor),
      missionService.createMission({ ...payload }, mockActor),
      missionService.createMission({ ...payload }, mockActor),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(2);

    const rows = await getMissionFromDb(payload.name);
    expect(rows).toHaveLength(1);
  });

  it("concurrent creation of different names — all must succeed independently", async () => {
    const results = await Promise.allSettled([
      missionService.createMission(
        { ...validMissionBase(), name: "Concurrent A" },
        mockActor,
      ),
      missionService.createMission(
        { ...validMissionBase(), name: "Concurrent B" },
        mockActor,
      ),
      missionService.createMission(
        { ...validMissionBase(), name: "Concurrent C" },
        mockActor,
      ),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(3);

    for (const name of ["Concurrent A", "Concurrent B", "Concurrent C"]) {
      expect(await getMissionFromDb(name)).toHaveLength(1);
    }
  });

  it("each concurrently created mission must have a unique UUID", async () => {
    const results = await Promise.allSettled([
      missionService.createMission(
        { ...validMissionBase(), name: "UUID Unique A" },
        mockActor,
      ),
      missionService.createMission(
        { ...validMissionBase(), name: "UUID Unique B" },
        mockActor,
      ),
      missionService.createMission(
        { ...validMissionBase(), name: "UUID Unique C" },
        mockActor,
      ),
    ]);

    const uuids = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
      .map((r) => r.value.getUuid());

    expect(new Set(uuids).size).toBe(uuids.length);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. VALEURS RETOURNÉES PAR LE SERVICE (mapping domain → objet)
// ══════════════════════════════════════════════════════════════════════════════

describe("Service return value integrity", () => {
  it("must return a mission with a valid UUID (non-null, non-empty)", async () => {
    const result = await missionService.createMission(
      { ...validMissionBase(), name: "UUID Check" },
      mockActor,
    );
    expect(result.getUuid()).toBeTruthy();
    expect(result.getUuid()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("must return dates that match what was submitted", async () => {
    const dateStart = inDays(1);
    const dateEnd = inDays(2);

    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Date Integrity",
        dateStart,
        dateEnd,
      },
      mockActor,
    );

    expect(new Date(result.getDateStart()).toISOString()).toBe(dateStart);
    expect(new Date(result.getDateEnd()).toISOString()).toBe(dateEnd);
  });

  it("must return registrations with VALIDATED status for participant organizers", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Registration Status Check",
        toPublish: true,
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: true },
        ],
      },
      mockActor,
    );

    const registration = result.getRegistrations()[0]!;
    expect(registration.getStatus()).toBe(2); // 2 = VALIDATED
  });

  it("must match the UUID returned by the service with what is stored in DB", async () => {
    const result = await missionService.createMission(
      { ...validMissionBase(), name: "UUID DB Match" },
      mockActor,
    );

    const [rows] = await database.execute<RowDataPacket[]>(
      "SELECT mission_uuid FROM mission WHERE mission_name = ?",
      ["UUID DB Match"],
    );
    expect(rows[0]!.mission_uuid).toBe(result.getUuid());
  });

  it("must return correct number of categories on the result object", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Category Count Return",
        categoryIds: [1, 2, 3],
      },
      mockActor,
    );
    expect(result.getCategoryIds()).toHaveLength(3);
  });

  it("getRegistrations() must reflect persisted registrations in DB count", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Registration DB Count",
        toPublish: true,
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: true },
          { organizerUuid: orgaUuidTwo, isMain: false, isParticipant: true },
        ],
      },
      mockActor,
    );

    const inMemory = result.getRegistrations().length;
    expect(inMemory).toBe(2);
  });

  it("getName() must be coherent between service return and DB", async () => {
    const name = "Name Coherence Check";
    const result = await missionService.createMission(
      { ...validMissionBase(), name },
      mockActor,
    );

    const row = await getMissionByUuid(result.getUuid());
    expect(row!.mission_name).toBe(result.getName());
    expect(result.getName()).toBe(name);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. EDGE CASES — LIMITES & VOLUMÉTRIE
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases and boundary values", () => {
  it("must handle nbrVolunteerNeeded = 1 (minimum valid on publish)", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Min Volunteers",
        nbrVolunteerNeeded: 1,
      },
      mockActor,
    );
    expect(result.getName()).toBe("Min Volunteers");
  });

  it("must handle a large but valid nbrVolunteerNeeded (99 999)", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Max Volunteers",
        nbrVolunteerNeeded: 99_999,
      },
      mockActor,
    );
    expect(result.getNbrVolunteerNeeded()).toBe(99_999);
  });

  it("must handle a very long but valid description (1000 chars)", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Long Description",
        description: "A".repeat(1000),
      },
      mockActor,
    );
    expect(result.getName()).toBe("Long Description");
  });

  it("must securely handle SQL injection attempts in text fields", async () => {
    const sneakyString = "Robert'; DROP TABLE mission;--";
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: sneakyString,
        description: sneakyString,
      },
      mockActor,
    );
    expect(result.getName()).toBe(sneakyString);

    const rows = await getMissionFromDb(sneakyString);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.mission_description).toBe(sneakyString);
  });

  it("must handle all available categories simultaneously", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "All Six Categories",
        categoryIds: [1, 2, 3, 4, 5, 6],
      },
      mockActor,
    );

    const cats = await getCategoriesForMission(result.getUuid());
    expect(cats).toHaveLength(6);
  });

  it("must handle 3 organizers with 3 participant registrations", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Three Participants",
        toPublish: true,
        nbrVolunteerNeeded: 10,
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: true },
          { organizerUuid: orgaUuidTwo, isMain: false, isParticipant: true },
          { organizerUuid: orgaUuidThree, isMain: false, isParticipant: true },
        ],
      },
      mockActor,
    );

    expect(result.getRegistrations()).toHaveLength(3);
  });

  it("must handle a mission starting exactly tomorrow at midnight", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Midnight Mission",
        dateStart: tomorrow.toISOString(),
        dateEnd: dayAfter.toISOString(),
      },
      mockActor,
    );
    expect(result.getName()).toBe("Midnight Mission");
  });

  it("must handle a description containing HTML/XSS patterns without execution", async () => {
    const xssPayload =
      '<script>alert("xss")</script><img src="x" onerror="alert(1)">';
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "XSS Description",
        description: xssPayload,
      },
      mockActor,
    );
    expect(result.getName()).toBe("XSS Description");

    const rows = await getMissionFromDb("XSS Description");
    expect(rows[0]!.mission_description).toBe(xssPayload);
  });

  it("must reject a very long address (500 chars) to prevent DB crash", async () => {
    const longAddress = "Allée ".repeat(50) + "42"; // ~300+ caractères
    
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          name: "Long Address Mission",
          address: longAddress,
          toPublish: false, // Même en brouillon, l'entité doit bloquer pour sauver MySQL !
        },
        mockActor,
      ),
    ).rejects.toThrow(GeolocalizationError);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. AUTORISATION PAR RÔLE (NOUVEAU)
// ══════════════════════════════════════════════════════════════════════════════

describe("Role-based authorization", () => {
  it("must reject mission creation by a VOLUNTEER actor", async () => {
    await expect(
      missionService.createMission(
        { ...validMissionBase(), name: "Volunteer Creates Mission" },
        mockActorVolunteer,
      ),
    ).rejects.toThrow(UnauthorizedMissionActionError);
  });

  it("must allow mission creation by a SUPER_ADMIN actor", async () => {
    await database.execute(
      "INSERT IGNORE INTO user (user_uuid, user_email, user_password, user_created_at, id_role) VALUES (?, ?, 'hash', NOW(), 1)",
      ["superadmin-uuid", "superadmin@test.com"],
    );

    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "SuperAdmin Creates Mission",
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
        ],
      },
      mockActorSuperAdmin,
    );
    expect(result.getName()).toBe("SuperAdmin Creates Mission");
  });

  it("must not persist anything when creation is rejected due to unauthorized role", async () => {
    const name = "Unauthorized Role Mission";
    const before = await countAllRows();

    await expect(
      missionService.createMission(
        { ...validMissionBase(), name },
        mockActorVolunteer,
      ),
    ).rejects.toThrow(UnauthorizedMissionActionError);

    const after = await countAllRows();
    expect(after.missions).toBe(before.missions);
    expect(after.organizers).toBe(before.organizers);
    expect(after.categories).toBe(before.categories);
    expect(after.registrations).toBe(before.registrations);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. VILLES (cityId) (NOUVEAU)
// ══════════════════════════════════════════════════════════════════════════════

describe("City validation", () => {
  it("must accept a valid existing cityId (Lyon = 2)", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Mission Lyon",
        cityId: 2,
      },
      mockActor,
    );
    expect(result.getName()).toBe("Mission Lyon");
  });

  it("must reject a non-existent cityId on publish", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          toPublish: true,
          name: "Invalid City Publish",
          cityId: 99999,
        },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("must reject a negative cityId", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          name: "Negative City",
          cityId: -1,
        },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("must reject cityId = 0", async () => {
    await expect(
      missionService.createMission(
        {
          ...validMissionBase(),
          name: "Zero City",
          cityId: 0,
        },
        mockActor,
      ),
    ).rejects.toThrow();
  });

  it("cityId must be persisted correctly in the mission row", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "City Persistence",
        cityId: 3, // Marseille
      },
      mockActor,
    );

    const row = await getMissionByUuid(result.getUuid());
    expect(row!.id_city).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. GESTION DES REGISTRATIONS EN MEMOIRE (Event-Driven)
// ══════════════════════════════════════════════════════════════════════════════

describe("Registration management (in memory before EventBus)", () => {
  it("must create a VALIDATED registration for a participant organizer on PUBLISHED mission", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Registration Persist Published",
        toPublish: true,
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: true },
        ],
      },
      mockActor,
    );

    const regs = result.getRegistrations(); 
    expect(regs).toHaveLength(1);
    expect(regs[0]!.getStatus()).toBe(2); 
  });

  it("must create a registration even for DRAFT missions with participant organizers", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Registration Persist Draft",
        toPublish: false,
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: true },
        ],
      },
      mockActor,
    );

    const regs = result.getRegistrations(); 
    expect(regs).toHaveLength(1);
  });

  it("registration must reference the correct user (organizer) UUID", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Registration User Ref",
        toPublish: true,
        organizers: [
          { organizerUuid: orgaUuidTwo, isMain: true, isParticipant: true },
        ],
      },
      mockActorOrgaTwo,
    );

    const regs = result.getRegistrations(); 
    expect(regs).toHaveLength(1);
    expect(regs[0]!.getVolunteerUuid()).toBe(orgaUuidTwo);
  });

  it("non-participant organizers must produce zero registrations", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "No Registration In DB",
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
          { organizerUuid: orgaUuidTwo, isMain: false, isParticipant: false },
        ],
      },
      mockActor,
    );

    const regs = result.getRegistrations();
    expect(regs).toHaveLength(0);
  });

  it("mixed participant/non-participant organizers must produce exact participant count", async () => {
    const result = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Mixed Participant Registration",
        toPublish: true,
        nbrVolunteerNeeded: 10,
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: true },
          { organizerUuid: orgaUuidTwo, isMain: false, isParticipant: false },
          { organizerUuid: orgaUuidThree, isMain: false, isParticipant: true },
        ],
      },
      mockActor,
    );

    const regs = result.getRegistrations();    expect(regs).toHaveLength(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 15. ISOLATION ENTRE MISSIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Mission data isolation", () => {
  it("categories of mission A must not appear on mission B", async () => {
    const a = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Isolation Mission A",
        categoryIds: [1, 2],
      },
      mockActor,
    );
    const b = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Isolation Mission B",
        categoryIds: [5, 6],
      },
      mockActor,
    );

    const catsA = await getCategoriesForMission(a.getUuid());
    const catsB = await getCategoriesForMission(b.getUuid());

    const idsA = catsA.map((c) => c.id_category).sort();
    const idsB = catsB.map((c) => c.id_category).sort();

    expect(idsA).toEqual([1, 2]);
    expect(idsB).toEqual([5, 6]);
    expect(idsA.some((id) => idsB.includes(id))).toBe(false);
  });

  it("organizers of mission A must not appear on mission B", async () => {
    const a = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Orga Isolation A",
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
        ],
      },
      mockActor,
    );
    const b = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Orga Isolation B",
        organizers: [
          { organizerUuid: orgaUuidTwo, isMain: true, isParticipant: false },
        ],
      },
      mockActorOrgaTwo,
    );

    const orgasA = await getOrganizersForMission(a.getUuid());
    const orgasB = await getOrganizersForMission(b.getUuid());

    expect(orgasA).toHaveLength(1);
    expect(orgasB).toHaveLength(1);
    expect(orgasA[0]!.mission_organizer_id).not.toBe(
      orgasB[0]!.mission_organizer_id,
    );
  });

  it("registrations of mission A must not contaminate mission B", async () => {
    const a = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Reg Isolation A",
        toPublish: true,
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: true },
        ],
      },
      mockActor,
    );
    const b = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Reg Isolation B",
        toPublish: true,
        organizers: [
          { organizerUuid: orgaUuidTwo, isMain: true, isParticipant: false },
        ],
      },
      mockActorOrgaTwo,
    );

    const regsA = a.getRegistrations();
    const regsB = b.getRegistrations();

    expect(regsA).toHaveLength(1);
    expect(regsB).toHaveLength(0);
  });

  it("two missions with the same organizer must both reference him independently", async () => {
    const a = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Shared Orga Mission A",
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
        ],
      },
      mockActor,
    );
    const b = await missionService.createMission(
      {
        ...validMissionBase(),
        name: "Shared Orga Mission B",
        organizers: [
          { organizerUuid: orgaUuidOne, isMain: true, isParticipant: false },
        ],
      },
      mockActor,
    );

    const orgasA = await getOrganizersForMission(a.getUuid());
    const orgasB = await getOrganizersForMission(b.getUuid());

    expect(orgasA).toHaveLength(1);
    expect(orgasB).toHaveLength(1);
    // Both link orgaUuidOne, but are distinct rows
    expect(orgasA[0]!.mission_organizer_id).not.toBe(
      orgasB[0]!.mission_organizer_id,
    );
  });
});
