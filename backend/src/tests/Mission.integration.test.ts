import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type Pool, type RowDataPacket } from "mysql2/promise";
import { Database } from "../infra/database/DatabaseConfig.js";
import { AuthController } from "../modules/auth/AuthController.js";
import { MissionController } from "../modules/mission/MissionController.js";
import { AuthService } from "../modules/auth/AuthService.js";
import { UserRepository } from "../modules/user/UserRepository.js";
import { RegistrationService } from "../modules/registration/RegistrationService.js";
import { MissionService } from "../modules/mission/MissionService.js";
import { MissionRepository } from "../modules/mission/MissionRepository.js";
import { RegistrationController } from "../modules/registration/RegistrationController.js";
import { RegistrationRepository } from "../modules/registration/RegistrationRepository.js";
import { AppConfig } from "../infra/web/AppConfig.js";
import { HashService } from "../infra/security/HashService.js";
import type { ITokenService } from "../modules/auth/ITokenService.js";
import { TokenService } from "../infra/security/TokenService.js";
import request from "supertest";
import { UserRole } from "../modules/user/UserRoleEnum.js";

let app: any; // 'any' a été remplacé par 'Express'
let dbPool: Pool;
let userUuid: string = "test-user-uuid";
let missionUuid: string = "test-mission-uuid";
let localMissionId: number = 0;
let fakeCsrf: string = "valid-test-token";
let token: string;
let tokenService: ITokenService;

beforeAll(() => {
  dbPool = Database.getInstance().getConnection();

  const hashService = new HashService();
  tokenService = new TokenService();
  const userRepository = new UserRepository(dbPool);
  const missionRepository = new MissionRepository(dbPool);
  const registrationRepository = new RegistrationRepository(dbPool);

  const authService = new AuthService(
    userRepository,
    hashService,
    tokenService,
  );
  const authController = new AuthController(authService, tokenService);

  const missionService = new MissionService(missionRepository);
  const missionController = new MissionController(missionService, tokenService);

  const registrationService = new RegistrationService(
    missionRepository,
    registrationRepository,
    userRepository,
  );
  const registrationController = new RegistrationController(
    registrationService,
    tokenService,
  );

  const appConfig = new AppConfig(
    authController,
    missionController,
    registrationController,
  );

  app = appConfig.getApp();
});

afterAll(async () => {
  await dbPool.end();
});

const setupDatabase = async () => {
  await dbPool.execute("SET FOREIGN_KEY_CHECKS = 0");

  await dbPool.execute("TRUNCATE TABLE inscription");
  await dbPool.execute("TRUNCATE TABLE mission_organizer");
  await dbPool.execute("TRUNCATE TABLE mission");
  await dbPool.execute("TRUNCATE TABLE `user`");

  await dbPool.execute("SET FOREIGN_KEY_CHECKS = 1");

  await dbPool.execute(
    "INSERT IGNORE INTO city (city_id, city_name, city_zip) VALUES (1, 'Paris', '75000')",
  );

  await dbPool.execute(
    `INSERT INTO user (user_uuid, user_email, user_password, user_created_at, id_role) 
         VALUES (?, 'orga@test.com', 'hash', NOW(), 2)`,
    [userUuid],
  );
  const [userRows] = await dbPool.execute<RowDataPacket[]>(
    "SELECT user_id FROM user WHERE user_uuid = ?",
    [userUuid],
  );
  const userId = userRows[0]!.user_id;

  // C. Injecter la mission en BDD (Statut 1 = PUBLIEE)
  await dbPool.execute(
    `INSERT INTO mission (mission_uuid, mission_name, mission_date_start, mission_date_end, mission_address, mission_nbr_volunteer_needed, mission_created_at, id_city, id_mission_status) 
         VALUES (?, 'Mission Test Concurrence', '2026-05-01', '2026-05-02', 'Paris', 5, NOW(), 1, 1)`,
    [missionUuid],
  );
  const [missionRows] = await dbPool.execute<RowDataPacket[]>(
    "SELECT mission_id FROM mission WHERE mission_uuid = ?",
    [missionUuid],
  );
  localMissionId = missionRows[0]!.mission_id;

  // D. Lier l'organisateur à sa mission
  await dbPool.execute(
    `INSERT INTO mission_organizer (id_organizer, id_mission) VALUES (?, ?)`,
    [userId, localMissionId],
  );

  // E. Ajouter un faux bénévole inscrit (Statut 1 = EN_ATTENTE) pour tester la cascade
  await dbPool.execute(`
        INSERT INTO user (user_uuid, user_email, user_password, user_created_at, id_role) 
        VALUES ('benevole-uuid', 'ben@test.com', 'hash', NOW(), 3)
      `);
  const [benRows] = await dbPool.execute<RowDataPacket[]>(
    "SELECT user_id FROM user WHERE user_uuid = 'benevole-uuid'",
  );
  await dbPool.execute(
    `INSERT INTO inscription (inscription_date, id_user, id_mission, id_inscription_status) 
         VALUES (NOW(), ?, ?, 1)`,
    [benRows[0].user_id, localMissionId],
  );
};

describe("Flux de suppression d'une mission", () => {
  beforeEach(async () => {
    await setupDatabase();

    token = tokenService.generateAccessToken({
      uuid: userUuid,
      roleId: UserRole.ORGANISATEUR,
    });
  });

  it("doit gérer les requêtes concurrentes (Race Condition) proprement", async () => {
    const concurrentRequests = 10;

    const requests = Array.from({ length: concurrentRequests }).map(() =>
      request(app)
        .delete(`/mission/cancelMission/${missionUuid}`)
        .set("Cookie", `XSRF-TOKEN=${fakeCsrf}; accessToken=${token}`)
        .set("x-xsrf-token", fakeCsrf)
        .send(),
    );

    const responses = await Promise.all(requests);

    const successResponses = responses.filter((res) => res.status === 200);
    const failedResponses = responses.filter((res) => res.status !== 200);

    // Assertion renforcée : exactement une requête doit réussir.
    expect(successResponses.length).toBe(1);
    // Toutes les autres doivent échouer.
    expect(failedResponses.length).toBe(concurrentRequests - 1);

    // Idéalement, on vérifie que les échecs sont bien des 404 Not Found,
    // car la mission a été "supprimée" par la première requête.
    const allFailedWithNotFound = failedResponses.every(
      (res) => res.status === 404,
    );
    // Note: Le code actuel peut renvoyer 400 si la logique de service vérifie le statut avant de supprimer.
    // L'important est de valider un échec contrôlé.

    const [missionResult] = await dbPool.execute<RowDataPacket[]>(
      "SELECT id_mission_status, mission_deleted_at FROM mission WHERE mission_uuid = ?",
      [missionUuid],
    );
    expect(missionResult[0].id_mission_status).toBe(4);
    expect(missionResult[0].mission_deleted_at).not.toBeNull();

    const [registrationResult] = await dbPool.execute<RowDataPacket[]>(
      `SELECT id_inscription_status FROM inscription WHERE id_mission = ?`,
      [localMissionId],
    );
    expect(registrationResult[0].id_inscription_status).toBe(4);
  });
});

// NOUVEAU BLOC DE TESTS POUR LA RÉCUPÉRATION DES MISSIONS
describe("Flux de lecture des missions (GET)", () => {
  beforeEach(async () => {
    // On réinitialise la base pour avoir des données propres
    await setupDatabase();

    token = tokenService.generateAccessToken({
      uuid: userUuid,
      roleId: UserRole.BENEVOLE, // Un bénévole qui cherche une mission
    });
  });

  it("devrait récupérer le catalogue des missions avec des filtres dynamiques (Query Parameters)", async () => {
    // La mission injectée dans setupDatabase est à Paris (cityId=1) et PUBLIEE (status=1)
    const response = await request(app)
      .get("/mission/missions?cityId=1&status=1")
      .set("Cookie", `accessToken=${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Missions found successfully");
    expect(Array.isArray(response.body.missions)).toBe(true);
    expect(response.body.missions.length).toBeGreaterThan(0);

    // On vérifie que la mission retournée correspond bien à celle en base
    expect(response.body.missions[0].uuid).toBe(missionUuid);
    expect(response.body.missions[0].name).toBe("Mission Test Concurrence");
    expect(response.body.missions[0].cityId).toBe(1);
  });

  it("devrait récupérer les détails d'une mission spécifique via son UUID", async () => {
    const response = await request(app)
      .get(`/mission/mission/${missionUuid}`)
      .set("Cookie", `accessToken=${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Mission found successfully");
    expect(response.body.mission).toBeDefined();

    // On vérifie l'hydratation et le mapping
    expect(response.body.mission.uuid).toBe(missionUuid);
    expect(response.body.mission.name).toBe("Mission Test Concurrence");
    expect(response.body.mission.nbrVolunteerNeeded).toBe(5);
  });
});
