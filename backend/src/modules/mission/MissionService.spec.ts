import { describe, it, expect, vi, beforeEach } from "vitest";
import { MissionService } from "./MissionService.js";
import type { IMissionRepository } from "./IMissionRepository.js";
import { Mission } from "./MissionModel.js";
import { MissionStatus } from "./MissionStatusEnum.js";
import { MissionNameAlreadyExistError } from "../../domain/exceptions/mission/MissionNameAlreadyExistError.js";
import { CreateMissionDTO } from "./dtos/CreateMissionDTO.js";

describe("MissionService", () => {
  let mockMissionRepository: IMissionRepository;
  let missionService: MissionService;
  let defaultMission: Mission;
  let defaultMissionDTO: CreateMissionDTO;

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
      registrations: [],
      organizerUuids: ["1"],
    });
    defaultMissionDTO = Object.assign(new CreateMissionDTO(), {
      name: "Aider à la récolte d'habits.",
      dateStart: "2025-07-01T10:00:00Z",
      dateEnd: "2025-07-01T18:00:00Z",
      address: "25 avenue Marie Reynoard",
      nbrVolunteerNeeded: 15,
      cityId: 5,
      organizerUuids: ["123e4567-e89b-12d3-a456-426614174001"],
    });

    mockMissionRepository = {
      findByUuid: vi.fn(),
      findByName: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };

    missionService = new MissionService(mockMissionRepository);
  });

  describe("createMission()", () => {
    it("doit lever une erreur si le nom de la mission existe déjà", async () => {
      vi.mocked(mockMissionRepository.create).mockRejectedValue(
        new MissionNameAlreadyExistError(
          `La mission : ${defaultMissionDTO.name} existe déjà.`,
        ),
      );

      await expect(
        missionService.createMission(defaultMissionDTO),
      ).rejects.toThrow(MissionNameAlreadyExistError);
    });
    it("doit créer et retourner une mission avec succès.", async () => {
      vi.mocked(mockMissionRepository.create).mockResolvedValue(defaultMission);

      const result = await missionService.createMission(defaultMissionDTO);

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
        registrations: [],
      });
      expect(mockMissionRepository.create).toHaveBeenCalledWith(
        expect.any(Mission),
        expect.any(Array),
      );
    });
  });
});
