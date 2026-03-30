import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import {
  type Pool,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";
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
import supertest from "supertest";
import { UserRole } from "../modules/user/UserRoleEnum.js";
import { RegistrationStatus } from "../modules/registration/RegistrationStatusEnum.js";
import { AppConfig } from "../infra/web/AppConfig.js";
import { HashService } from "../infra/security/HashService.js";
import type { ITokenService } from "../modules/auth/ITokenService.js";
import { TokenService } from "../infra/security/TokenService.js";
import type { Express } from "express";

let app: Express;
let dbPool: Pool;
let volunteerId: number;
let missionId: number;
let registrationId: number;
let fakeCsrf: string = "valid-test-token";
let adminId: number;
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
  // On vide les tables pour avoir un environnement vierge
  await dbPool.execute("DELETE FROM inscription");
  await dbPool.execute("DELETE FROM mission_organizer");
  await dbPool.execute("DELETE FROM mission_category");
  await dbPool.execute("DELETE FROM mission");
  await dbPool.execute("DELETE FROM `user`");
  // On crée la ville pour les tests
  await dbPool.execute(
    "INSERT IGNORE INTO city (city_id, city_name, city_zip) VALUES (1, 'Paris', '75000')",
  );
  // On insert le user unique SuperAdmin
  const [adminResult] = await dbPool.execute<ResultSetHeader>(`
    INSERT INTO \`user\` (user_uuid, user_email, user_password, user_created_at, id_role) 
      VALUES ('user-uuid-admin', 'admin@test.com', 'hashed_password', NOW(), ${UserRole.SUPER_ADMIN})`);
  adminId = adminResult.insertId;
  // On insert un user Organizer
  const [organizerResult] = await dbPool.execute<ResultSetHeader>(`
      INSERT INTO \`user\` (user_uuid, user_email, user_password, user_created_at, id_role) 
      VALUES ('user-uuid-456', 'organizer@test.com', 'hashed_password', NOW(), ${UserRole.ORGANISATEUR})
    `);
  const organizerId = organizerResult.insertId;

  // On insère une mission de test "en dur"
  const [missionResult] = await dbPool.execute<ResultSetHeader>(`
      INSERT INTO mission (mission_uuid, mission_name, mission_date_start, mission_date_end, mission_address, mission_nbr_volunteer_needed, mission_created_at, id_city, id_mission_status) 
      VALUES ('mission-uuid-123', 'Mission Test', '2026-01-01', '2026-01-02', '10 rue test', 1, NOW(), 1, 2)
    `);
  missionId = missionResult.insertId;

  // On lie la mission et l'organizer
  await dbPool.execute(`
      INSERT INTO mission_organizer (id_mission, id_organizer) 
      VALUES (${missionId}, ${organizerId})
    `);

  // On insère un faux bénévole
  const [volunteerResult] = await dbPool.execute<ResultSetHeader>(`
      INSERT INTO \`user\` (user_uuid, user_email, user_password, user_created_at, id_role) 
      VALUES ('user-uuid-123', 'benevole@test.com', 'hashed_password', NOW(), ${UserRole.BENEVOLE})
    `);

  volunteerId = volunteerResult.insertId;
};

describe("Flux d'inscription d'une Mission", () => {
  beforeEach(async () => {
    await setupDatabase();
  });

  it("devrait retourner 401 si le token est manquant", async () => {
    const response = await supertest(app)
      .post("/mission/mission-uuid-123/registration")
      // On valide la couche CSRF
      .set("Cookie", [`XSRF-TOKEN=${fakeCsrf}`])
      .set("x-xsrf-token", fakeCsrf)
      .send();

    expect(response.status).toBe(401);
  });
  it("devrait retourner 201 si le token est valide", async () => {
    const accessToken = tokenService.generateAccessToken({
      uuid: "user-uuid-123",
      roleId: 3,
    });

    const response = await supertest(app)
      .post("/mission/mission-uuid-123/registration")
      .set("Cookie", [`XSRF-TOKEN=${fakeCsrf}`, `accessToken=${accessToken}`])
      .set("x-xsrf-token", fakeCsrf)
      .send();

    expect(response.status).toBe(201);

    const [inscriptionResult] = await dbPool.execute<RowDataPacket[]>(
      "SELECT * FROM inscription",
    );

    expect(inscriptionResult.length).toBe(1);
    const row = inscriptionResult[0] as RowDataPacket;
    expect(row.id_mission).toBe(missionId);
    expect(row.id_user).toBe(volunteerId);
  });
});
describe("Siège Musical - Last Slot Race Condition", () => {
  let missionUuidLastSlot: string = "mission-last-slot-uuid";
  let missionIdLastSlot: number;
  let volunteer1Uuid: string = "volunteer-1-uuid";
  let volunteer2Uuid: string = "volunteer-2-uuid";
  let volunteer1Id: number;
  let volunteer2Id: number;
  let organizerId: number;

  beforeEach(async () => {
    // Setup: Reinitialize DB
    await dbPool.execute("DELETE FROM inscription");
    await dbPool.execute("DELETE FROM mission_organizer");
    await dbPool.execute("DELETE FROM mission_category");
    await dbPool.execute("DELETE FROM mission");
    await dbPool.execute("DELETE FROM `user`");

    // Create city
    await dbPool.execute(
      "INSERT IGNORE INTO city (city_id, city_name, city_zip) VALUES (1, 'Paris', '75000')",
    );

    // Create organizer
    const [organizerRes] = await dbPool.execute<ResultSetHeader>(`
      INSERT INTO \`user\` (user_uuid, user_email, user_password, user_created_at, id_role)
      VALUES ('organizer-uuid', 'organizer@test.com', 'hashed', NOW(), ${UserRole.ORGANISATEUR})
    `);
    organizerId = organizerRes.insertId;

    // Create 2 volunteers
    const [vol1Res] = await dbPool.execute<ResultSetHeader>(
      `
      INSERT INTO \`user\` (user_uuid, user_email, user_password, user_created_at, id_role)
      VALUES (?, 'volunteer1@test.com', 'hashed', NOW(), ${UserRole.BENEVOLE})
    `,
      [volunteer1Uuid],
    );
    volunteer1Id = vol1Res.insertId;

    const [vol2Res] = await dbPool.execute<ResultSetHeader>(
      `
      INSERT INTO \`user\` (user_uuid, user_email, user_password, user_created_at, id_role)
      VALUES (?, 'volunteer2@test.com', 'hashed', NOW(), ${UserRole.BENEVOLE})
    `,
      [volunteer2Uuid],
    );
    volunteer2Id = vol2Res.insertId;

    // Create mission with capacity = 1 (CRITICAL: only 1 slot!)
    const [missionRes] = await dbPool.execute<ResultSetHeader>(
      `
      INSERT INTO mission 
      (mission_uuid, mission_name, mission_date_start, mission_date_end, mission_address, mission_nbr_volunteer_needed, mission_created_at, id_city, id_mission_status)
      VALUES (?, 'Mission Siège Musical', '2026-05-15', '2026-05-16', '10 rue du test', 1, NOW(), 1, 2)
    `,
      [missionUuidLastSlot],
    );
    missionIdLastSlot = missionRes.insertId;

    // Link organizer to mission
    await dbPool.execute(
      `
      INSERT INTO mission_organizer (id_mission, id_organizer)
      VALUES (?, ?)
    `,
      [missionIdLastSlot, organizerId],
    );
  });

  it("devrait garantir qu'un seul bénévole s'inscrive quand deux envoient POST simultanés sur la dernière place", async () => {
    // Generate tokens for both volunteers
    const token1 = tokenService.generateAccessToken({
      uuid: volunteer1Uuid,
      roleId: UserRole.BENEVOLE,
    });

    const token2 = tokenService.generateAccessToken({
      uuid: volunteer2Uuid,
      roleId: UserRole.BENEVOLE,
    });

    // Launch 2 concurrent registration requests to the same mission (capacity = 1)
    const [response1, response2] = await Promise.all([
      supertest(app)
        .post(`/mission/${missionUuidLastSlot}/registration`)
        .set("Cookie", [`XSRF-TOKEN=${fakeCsrf}`, `accessToken=${token1}`])
        .set("x-xsrf-token", fakeCsrf)
        .send(),

      supertest(app)
        .post(`/mission/${missionUuidLastSlot}/registration`)
        .set("Cookie", [`XSRF-TOKEN=${fakeCsrf}`, `accessToken=${token2}`])
        .set("x-xsrf-token", fakeCsrf)
        .send(),
    ]);

    // Assert: ONE must succeed (201), ONE must fail (409 Mission Full or 400)
    const successCount = [response1, response2].filter(
      (r) => r.status === 201,
    ).length;
    const failureCount = [response1, response2].filter(
      (r) => r.status === 409 || r.status === 400,
    ).length;

    expect(successCount).toBe(1);
    expect(failureCount).toBe(1);

    // Assert: Verify which one succeeded and which failed
    if (response1.status === 201) {
      expect(response1.status).toBe(201);
      expect([400, 409]).toContain(response2.status);
    } else {
      expect(response2.status).toBe(201);
      expect([400, 409]).toContain(response1.status);
    }

    // CRITICAL: Verify DB integrity - exactly 1 inscription for this mission
    const [inscriptionRows] = await dbPool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as cnt FROM inscription WHERE id_mission = ?",
      [missionIdLastSlot],
    );

    expect(inscriptionRows[0]?.cnt).toBe(1);

    // Verify the successful volunteer is the one inscribed
    const [successfulInscription] = await dbPool.execute<RowDataPacket[]>(
      "SELECT id_user FROM inscription WHERE id_mission = ?",
      [missionIdLastSlot],
    );

    const inscribedUserId = successfulInscription[0]?.id_user;
    expect([volunteer1Id, volunteer2Id]).toContain(inscribedUserId);

    // Verify the status is valid (EN_ATTENTE = 1 or VALIDEE = 2)
    const [statusCheck] = await dbPool.execute<RowDataPacket[]>(
      "SELECT id_inscription_status FROM inscription WHERE id_mission = ? LIMIT 1",
      [missionIdLastSlot],
    );

    expect([1, 2]).toContain(statusCheck[0]?.id_inscription_status);
  });
});
describe("Flux de désinscription d'une Mission", () => {
  beforeEach(async () => {
    await setupDatabase();

    const [registrationResult] = await dbPool.execute<ResultSetHeader>(`
      INSERT INTO inscription (inscription_date, inscription_recall_send_at, id_user, id_mission, id_inscription_status) 
      VALUES (NOW(), NULL, ${volunteerId}, ${missionId}, 1)
    `);
    registrationId = registrationResult.insertId;

    const [intrusVolunteerResult] = await dbPool.execute<ResultSetHeader>(`
      INSERT INTO \`user\` (user_uuid, user_email, user_password, user_created_at, id_role) 
      VALUES ('user-uuid-789', 'benevole789@test.com', 'hashed_password', NOW(), ${UserRole.BENEVOLE})
    `);

    const [intrusOrganizerResult] = await dbPool.execute<ResultSetHeader>(`
      INSERT INTO \`user\` (user_uuid, user_email, user_password, user_created_at, id_role) 
      VALUES ('user-uuid-546', 'benevole546@test.com', 'hashed_password', NOW(), ${UserRole.ORGANISATEUR})
    `);
  });
  it("devrait renvoyer 400 si un intrus, bénévole non-inscrit à la mission, essaie de supprimer une inscription qui n'est pas la sienne", async () => {
    // On genere l'acces token d'un utilisateur qui n'est pas inscrit a la mission
    const accessToken = tokenService.generateAccessToken({
      uuid: "user-uuid-789",
      roleId: 3,
    });

    const response = await supertest(app)
      .delete("/mission/mission-uuid-123/registration/user-uuid-123")
      .set("Cookie", [`XSRF-TOKEN=${fakeCsrf}`, `accessToken=${accessToken}`])
      .set("x-xsrf-token", fakeCsrf)
      .send();

    expect(response.status).toBe(400);
  });
  it("devrait renvoyer 400 si un intrus, organisateur, essaie de supprimer une inscription sur une mission qu'il n'organise pas", async () => {
    // On genere l'acces token de l'organisateur intrus
    const accessToken = tokenService.generateAccessToken({
      uuid: "user-uuid-546",
      roleId: 2,
    });

    const response = await supertest(app)
      .delete("/mission/mission-uuid-123/registration/user-uuid-123")
      .set("Cookie", [`XSRF-TOKEN=${fakeCsrf}`, `accessToken=${accessToken}`])
      .set("x-xsrf-token", fakeCsrf)
      .send();

    expect(response.status).toBe(400);
  });
  it("devrait renvoyer 200 si le bénévole inscrit supprime son inscription, status inscription = annulée", async () => {
    // 1. Token du bénévole légitime
    const accessToken = tokenService.generateAccessToken({
      uuid: "user-uuid-123",
      roleId: UserRole.BENEVOLE,
    });

    // 2. Requête d'annulation
    const response = await supertest(app)
      .delete("/mission/mission-uuid-123/registration/user-uuid-123")
      .set("Cookie", [`XSRF-TOKEN=${fakeCsrf}`, `accessToken=${accessToken}`])
      .set("x-xsrf-token", fakeCsrf)
      .send();

    // 3. Vérification de la réponse HTTP
    expect(response.status).toBe(200);

    // 4. Vérification du Soft Delete en base de données
    const [inscriptionResult] = await dbPool.execute<RowDataPacket[]>(
      "SELECT id_inscription_status FROM inscription WHERE id_mission = ? AND id_user = ?",
      [missionId, volunteerId],
    );

    // L'inscription existe toujours physiquement...
    expect(inscriptionResult.length).toBe(1);
    const row = inscriptionResult[0] as RowDataPacket;
    expect(row.id_inscription_status).toBe(RegistrationStatus.ANNULEE);
  });

  it("devrait renvoyer 200 si le bénévole inscrit est désinscrit par un organisateur de la mission, status inscription = refusée", async () => {
    // 1. Token de l'organisateur de la mission
    const accessToken = tokenService.generateAccessToken({
      uuid: "user-uuid-456",
      roleId: UserRole.ORGANISATEUR,
    });

    // 2. L'organisateur supprime l'inscription du bénévole cible
    const response = await supertest(app)
      .delete("/mission/mission-uuid-123/registration/user-uuid-123")
      .set("Cookie", [`XSRF-TOKEN=${fakeCsrf}`, `accessToken=${accessToken}`])
      .set("x-xsrf-token", fakeCsrf)
      .send();

    // 3. Vérification de la réponse HTTP
    expect(response.status).toBe(200);

    // 4. Vérification du Soft Delete en base de données
    const [inscriptionResult] = await dbPool.execute<RowDataPacket[]>(
      "SELECT id_inscription_status FROM inscription WHERE id_mission = ? AND id_user = ?",
      [missionId, volunteerId],
    );

    expect(inscriptionResult.length).toBe(1);
    const row = inscriptionResult[0] as RowDataPacket;
    expect(row.id_inscription_status).toBe(RegistrationStatus.REFUSEE);
  });
});
