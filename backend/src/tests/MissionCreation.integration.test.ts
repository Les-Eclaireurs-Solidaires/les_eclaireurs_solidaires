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
  await database.execute("TRUNCATE TABLE inscription");

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
  // Ajuste ici si tu as renommé getConnection en getPool dans ta classe Database
  database = Database.getInstance().getPool(); 
  
  const hashService = new HashService();
  const tokenService = new TokenService();

  const userRepository = new UserRepository(database);
  const missionRepository = new MissionRepository(database);
  const registrationRepository = new RegistrationRepository(database); // Ajout du repo inscription

  const authService = new AuthService(
    userRepository,
    hashService,
    tokenService,
  );
  
  // Injection des 3 dépendances requises pour le transactionnel
  missionService = new MissionService(missionRepository, registrationRepository, database);

  const authController = new AuthController(authService, tokenService);
  const missionController = new MissionController(missionService, tokenService);

  app = new AppConfig(authController, missionController).getApp();
});

afterAll(async () => {
  // Ajoute l'appel de déconnexion spécifique à mysql2 pour éviter que le test ne reste suspendu
  // Si tu as fait la méthode disconnect dans Database : await Database.getInstance().disconnect();
  // Sinon :
  await Database.getInstance().disconnect();
});

describe("Mission creation flow", () => {
  beforeEach(async () => {
    await setupDatabase();
  });

  it("must create a mission with PUBLISHED status and a registration", async () => {
    const missionToCreate: CreateMissionDTO = {
      name: "Mission Test Alpha",
      description: "Description de test pour les test de la création de la mission.",
      // Attention à mettre des dates valides dans le futur
      dateStart: new Date(Date.now() + 86400000).toISOString(), // +1 jour
      dateEnd: new Date(Date.now() + 172800000).toISOString(), // +2 jours
      address: "14 rue du Test",
      nbrVolunteerNeeded: 1,
      cityId: 1,
      categoryIds: [2, 3],
      toPublish: true,
      organizers: [
        {
          organizerUuid: orgaUuidOne,
          isMain: true,
          isParticipant: true, // Ceci doit générer une inscription
        },
      ],
    };

    const result = await missionService.createMission(missionToCreate);

    expect(result.getStatus()).toBe(MissionStatus.PUBLISHED);
    expect(result.getName()).toBe(missionToCreate.name);
    // Vérifie que l'organisateur participant a bien généré une inscription en mémoire
    expect(result.getRegistrations()).toHaveLength(1);
    expect(result.getRegistrations()[0]!.getVolunteerUuid()).toBe(orgaUuidOne);
    const [inscriptions] = await database.execute<RowDataPacket[]>(
      "SELECT * FROM inscription WHERE id_user = ?",
      [orgaOneId] // L'ID interne que tu as intelligemment récupéré dans le setup !
    );
    expect(inscriptions).toHaveLength(1);
    expect(inscriptions[0]!.id_inscription_status).toBe(2); // 2 = VALIDATED
  });

  it("must create a mission with DRAFT status", async () => {
    const draftMission: CreateMissionDTO = {
      name: "Mission Brouillon",
      description: "Test",
      dateStart: new Date(Date.now() + 86400000).toISOString(), 
      dateEnd: new Date(Date.now() + 172800000).toISOString(), 
      address: "Adresse",
      nbrVolunteerNeeded: 1,
      cityId: 1,
      categoryIds: [1],
      toPublish: false,
      organizers: [
        {
          organizerUuid: orgaUuidOne,
          isMain: true,
          isParticipant: false, // Pas d'inscription
        },
      ],
    };

    const result = await missionService.createMission(draftMission);

    expect(result.getStatus()).toBe(MissionStatus.DRAFT);
    expect(result.getRegistrations()).toHaveLength(0);
  });

  it("must fail at the business level due to a duplicate name", async () => {
    const validMission: CreateMissionDTO = {
      name: "Mission Unique",
      description: "Test duplication",
      dateStart: new Date(Date.now() + 86400000).toISOString(), 
      dateEnd: new Date(Date.now() + 172800000).toISOString(), 
      address: "Adresse",
      nbrVolunteerNeeded: 1,
      cityId: 1,
      categoryIds: [1],
      toPublish: false,
      organizers: [
        {
          organizerUuid: orgaUuidOne,
          isMain: true,
          isParticipant: false,
        },
      ],
    };

    // Première création réussie
    await missionService.createMission(validMission);

    // Seconde création avec le même nom qui doit échouer
    await expect(missionService.createMission(validMission)).rejects.toThrow(MissionNameAlreadyExistError);
  });

  it("must fail at the model level on, for example, the date test", async () => {
    const invalidMissionDates: CreateMissionDTO = {
      name: "Mission Dates Invalides",
      description: "Test",
      // Date de début APRÈS la date de fin
      dateStart: "2026-12-01T08:00:00.000Z",
      dateEnd: "2026-10-01T08:00:00.000Z", 
      address: "Adresse",
      nbrVolunteerNeeded: 1,
      cityId: 1,
      categoryIds: [1, 4],
      toPublish: false,
      organizers: [
        {
          organizerUuid: orgaUuidOne,
          isMain: true,
          isParticipant: false,
        },
      ],
    };

    // La classe Model ou le validateur doit intercepter les dates inversées
    await expect(missionService.createMission(invalidMissionDates)).rejects.toThrow(MissionDateError);
  });
});