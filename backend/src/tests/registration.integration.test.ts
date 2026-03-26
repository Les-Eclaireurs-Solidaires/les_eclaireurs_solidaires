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

let app: any;
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
