export interface MissionDTO {
  toPublish: boolean;
  name: string;
  description: string | null;
  dateStart: string | null;
  dateEnd: string | null;
  address: string | null;
  nbrVolunteerNeeded: number | null;
  cityId: number | null;
  categoryIds: number[] | null;
  organizers: Organizer[] | null;
}
export interface Organizer {
  organizerUuid: string;
  isMain?: boolean;
}