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
import { MissionStatus } from "../modules/mission/MissionStatusEnum.js";

let app: Express;
let database: Pool;
let missionService: MissionService;
let orgaUuidOne = "user-uuid-1";
let orgaUuidTwo = "user-uuid-2";
let orgaOneId: number;
let orgaTwoId: number;

const setupDatabase = async () => {
  await database.execute("SET FOREIGN_KEY_CHECKS = 0");

  await database.execute("TRUNCATE TABLE mission");
  await database.execute("TRUNCATE TABLE `user`");
  await database.execute("TRUNCATE TABLE mission_organizer");
  await database.execute("TRUNCATE TABLE mission_category");

  await database.execute("SET FOREIGN_KEY_CHECKS = 1");

  await database.execute(
    "INSERT IGNORE INTO city (city_id, city_name, city_zip) VALUES (1, 'Paris', '75000')",
  );

  await database.execute(`
    INSERT IGNORE INTO role (role_id,role_name)
     VALUES 
     (1,"SUPER_ADMIN"),
     (2,"ORGANISATEUR"),
     (3,"BENEVOLE")`);

  await database.execute(`
    INSERT IGNORE INTO mission_status (mission_status_id,mission_status_name)
     VALUES 
     (1,"DRAFT"),
     (2,"PUBLISHED"),
     (3,"FINISHED"),
     (4,"CANCELED") 
    `);

  await database.execute(`
    INSERT IGNORE INTO category (category_id,category_name)
     VALUES 
     (1,"SPORT"),(2,"Aide et autre"),(3,"Autre catégorie"),(4,"Catégorie de test")
    `);

  await database.execute(
    `
    INSERT IGNORE INTO user (user_uuid, user_email, user_password, user_created_at, id_role)
    VALUES (?, 'orga1@test.com', 'hash', NOW(), 2)`,
    [orgaUuidOne],
  );
  await database.execute(
    `
    INSERT IGNORE INTO user (user_uuid, user_email, user_password, user_created_at, id_role)
    VALUES(?, 'orga2@test.com', 'hash', NOW(), 2)`,
    [orgaUuidTwo],
  );

  const [orgaOne] = await database.execute<RowDataPacket[]>(
    "SELECT user_id FROM user WHERE user_uuid = ?",
    [orgaUuidOne],
  );
  orgaOneId = orgaOne[0]!.user_id;

  const [orgaTwo] = await database.execute<RowDataPacket[]>(
    "SELECT user_id FROM user WHERE user_uuid = ?",
    [orgaUuidTwo],
  );
  orgaTwoId = orgaTwo[0]!.user_id;
};

beforeAll(() => {
  database = Database.getInstance().getConnection();
  const hashService = new HashService();
  const tokenService = new TokenService();

  const userRepository = new UserRepository(database);
  const missionRepository = new MissionRepository(database);

  const authService = new AuthService(
    userRepository,
    hashService,
    tokenService,
  );
  missionService = new MissionService(missionRepository);

  const authController = new AuthController(authService, tokenService);
  const missionController = new MissionController(missionService, tokenService);

  app = new AppConfig(authController, missionController).getApp();
});
afterAll(async () => {
  await database.end();
});
describe("Mission creation flow", () => {
  beforeEach(async () => {
    await setupDatabase();
  });
  it("must create a mission with PUBLISHED status", async () => {
    const missionToCreate: CreateMissionDTO = {
      name: "Mission Test Alpha",
      description:
        "Description de test pour les test de la création de la mission.",
      dateStart: "2026-01-01T00:00:00.000Z",
      dateEnd: "2026-01-02T00:00:00.000Z",
      address: "14 rue du Test",
      nbrVolunteerNeeded: 1,
      cityId: 1,
      categoryIds: [2,3],
      organizerUuids: [orgaUuidOne],
      toPublish: true,
    };

    const result = await missionService.createMission(missionToCreate);

    expect(result.getStatus()).toBe(MissionStatus.PUBLISHED);
    expect(result.getName()).toBe(missionToCreate.name);
  });
  it("must create a mission with DRAFT status", async () => {
    const invalidMissionDates: CreateMissionDTO = {
      name: "Mission Dates Invalides",
      description: "Test",
      dateStart: "2026-12-01T08:00:00.000Z",
      dateEnd: "2026-10-01T08:00:00.000Z",
      address: "Adresse",
      nbrVolunteerNeeded: 1,
      cityId: 1,
      categoryIds: [1,4],
      organizerUuids: [orgaUuidOne],
      toPublish: false,
    };

    await expect(missionService.createMission(invalidMissionDates)).rejects.toThrow();
  });
  it("must fail at the business level due to a duplicate name", () => {});
  it("must fail at the model level on, for example, the date test", () => {});
});
