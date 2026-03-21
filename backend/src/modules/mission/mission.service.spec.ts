import { describe, it, expect, vi, beforeEach } from "vitest";
import { MissionService } from "./mission.service.js";
import type { IMissionRepository } from "./missionRepository.interface.js";
import { Mission } from "./mission.model.js";
import { MissionStatus } from "./missionStatus.enum.js";
import { CreateMissionDto } from "../../dtos/createMission.dto.js";

describe("MissionService", () => {
  let mockMissionRepository: IMissionRepository;
  let missionService: MissionService;
  let defaultMission: Mission;
  let defaultMissionDTO: CreateMissionDto;

  beforeEach(() => {
    defaultMission = new Mission({
      uuid: "123e4567-e89b-12d3-a456-426614174000",
      name: "Aider à la récolte d'habits.",
      dateStart: new Date("2025-02-01T18:00:00Z"),
      dateEnd: new Date("2025-07-01T18:00:00Z"),
      address: "25 avenue Marie Reynoard",
      nbrVolunteerNeeded: 15,
      createdAt: new Date(2025, 1, 1),
      cityId: 5,
      status: MissionStatus.PUBLIEE,
      inscriptions: [],
    });
    defaultMissionDTO = Object.assign(new CreateMissionDto(), {
      name: "Aider à la récolte d'habits.",
      dateStart: "2025-07-01T10:00:00Z",
      dateEnd: "2025-07-01T18:00:00Z",
      address: "25 avenue Marie Reynoard",
      nbrVolunteerNeeded: 15,
      cityId: 5,
      organizerIds: [1],
    });

    mockMissionRepository = {
      findByName: vi.fn(),
      create: vi.fn(),
    };

    missionService = new MissionService(mockMissionRepository);
  });

  describe("createMission()", () => {
    it("doit lever une erreur si le nom de la mission existe déjà", async () => {
      // ÉTAPE 1 : Préparer le contexte (Arrange)
      vi.mocked(mockMissionRepository.findByName).mockResolvedValue(
        defaultMission,
      );

      // ÉTAPE 2 & 3 : Agir et Vérifier (Act & Assert)
      await expect(
        missionService.createMission(defaultMissionDTO),
      ).rejects.toMatchObject(
        new Error("Une mission avec ce nom existe déjà."),
      );
    });
    it("doit créer et retourner une mission avec succès.", async () => {
      // 1. Prepa
      vi.mocked(mockMissionRepository.findByName).mockResolvedValue(null);
      vi.mocked(mockMissionRepository.create).mockResolvedValue(defaultMission);

      // 2. Action
      const result = await missionService.createMission(defaultMissionDTO);

      // 3. Verif
      expect(result).toMatchObject({
        uuid: "123e4567-e89b-12d3-a456-426614174000",
        name: "Aider à la récolte d'habits.",
        dateStart: new Date("2025-02-01T18:00:00Z"),
        dateEnd: new Date("2025-07-01T18:00:00Z"),
        address: "25 avenue Marie Reynoard",
        nbrVolunteerNeeded: 15,
        createdAt: new Date(2025, 1, 1),
        cityId: 5,
        status: MissionStatus.PUBLIEE,
        inscriptions: [],
      });
      expect(mockMissionRepository.create).toHaveBeenCalledWith(
        expect.any(Mission),
        expect.any(Array),
      );
    });
  });
});
