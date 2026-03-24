import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { AppConfig } from "../config/app.js";
import { type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { Database } from "../database/database.config.js";
import { AuthController } from "../modules/auth/auth.controller.js";
import { MissionController } from "../modules/mission/mission.controller.js";
import { AuthService } from "../modules/auth/auth.service.js";
import { UserRepository } from "../modules/user/user.repository.js";
import { RegistrationService } from "../modules/registration/registration.service.js";
import { MissionService } from "../modules/mission/mission.service.js";
import { MissionRepository } from "../modules/mission/mission.repository.js";
import { RegistrationController } from "../modules/registration/registration.controller.js";
import { RegistrationRepository } from "../modules/registration/registration.repository.js";
import { HashUtil } from "../utils/hash.util.js";
import supertest from "supertest";
import { TokenUtil } from "../utils/token.util.js";
import type { Registration } from "../modules/registration/registration.model.js";

describe("Flux d'Inscription à une Mission", () => {
  let app: any;
  let dbPool: Pool;
  let userId: number;
  let missionId: number;


  beforeAll(() => {
    dbPool = Database.getInstance().getConnection();

    const hashUtil = new HashUtil();
    const userRepository = new UserRepository(dbPool);
    const missionRepository = new MissionRepository(dbPool);
    const registrationRepository = new RegistrationRepository(dbPool);

    const authService = new AuthService(userRepository, hashUtil);
    const authController = new AuthController(authService);

    const missionService = new MissionService(missionRepository);
    const missionController = new MissionController(missionService);

    const registrationService = new RegistrationService(
      missionRepository,
      registrationRepository,
      userRepository,
    );
    const registrationController = new RegistrationController(
      registrationService,
    );

    const appConfig = new AppConfig(
      authController,
      missionController,
      registrationController,
    );

    app = appConfig.getApp();
  });

  beforeEach(async () => {
    // On vide les tables pour avoir un environnement vierge
    await dbPool.execute("DELETE FROM inscription");
    await dbPool.execute("DELETE FROM mission_organizer");
    await dbPool.execute("DELETE FROM mission");
    await dbPool.execute("DELETE FROM `user`");
    // On crée la ville pour les tests
    await dbPool.execute(
      "INSERT IGNORE INTO city (city_id, city_name, city_zip) VALUES (1, 'Paris', '75000')",
    );
    // On insert un user Organizer
    const [organizerResult] = await dbPool.execute<ResultSetHeader>(`
      INSERT INTO \`user\` (user_uuid, user_email, user_password, user_created_at, id_role) 
      VALUES ('user-uuid-456', 'organizer@test.com', 'hashed_password', NOW(), 3)
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
    const [userResult] = await dbPool.execute<ResultSetHeader>(`
      INSERT INTO \`user\` (user_uuid, user_email, user_password, user_created_at, id_role) 
      VALUES ('user-uuid-123', 'benevole@test.com', 'hashed_password', NOW(), 3)
    `);

    userId = userResult.insertId;
  });

  // Fermeture de la connexion à la fin
  afterAll(async () => {
    await dbPool.end();
  });

  it("devrait retourner 401 si le token est manquant", async () => {
    const fakeCsrf = "valid-test-token";

    const response = await supertest(app)
      .post("/mission/mission-uuid-123/registration")
      // On valide la couche CSRF
      .set("Cookie", [`XSRF-TOKEN=${fakeCsrf}`])
      .set("x-xsrf-token", fakeCsrf)
      .send();

    expect(response.status).toBe(401);
  });
  it("devrait retourner 201 si le token est valide", async () => {
    const fakeCsrf = "valid-test-token";

    const accessToken = TokenUtil.generateAccessToken({
      uuid: "user-uuid-123",
      roleId: 3,
    });

    const response = await supertest(app)
      .post("/mission/mission-uuid-123/registration")
      .set("Cookie", [`XSRF-TOKEN=${fakeCsrf}`, `accessToken=${accessToken}`])
      .set("x-xsrf-token", fakeCsrf)
      .send();
    if (response.status === 500) {
      console.log("DÉTAIL DE L'ERREUR 500 :", response.body);
    }
    expect(response.status).toBe(201);

    const [inscriptionResult]= await dbPool.execute<RowDataPacket[]>("SELECT * FROM inscription");
    expect(inscriptionResult.length).toBe(1);
    const row = inscriptionResult[0] as RowDataPacket;
    expect(row.id_mission).toBe(missionId);
    expect(row.id_user).toBe(userId);
  });
});

describe("Flux de désinscription à une Mission", () => {
  
});


