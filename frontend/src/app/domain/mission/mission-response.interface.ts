export interface IMissionResponse {
  uuid: string;
  name: string;
  description?: string | null;
  dateStart: Date;
  dateEnd: Date;
  address: string;
  nbrVolunteerNeeded: number;
  createdAt?: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
  organizerUuids: string[];
  cityId: number;
  status?: MissionStatus;
  registrations: IRegistration[];
}

export enum MissionStatus{
    BROUILLON = 1,
    PUBLIEE = 2,
    TERMINEE = 3,
    ANNULEE = 4    
}
export enum RegistrationStatus {
  // Signifie que l'inscription a la Mission est en attente de validation d'un Organisateur
  EN_ATTENTE = 1, 
  // Signifie que l'inscription a la Mission est validée par un organisateur 
  VALIDEE = 2, 
  // Signifie que l'inscription a la Mission est refusée par un organisateur  
  REFUSEE = 3,
  // Signifie que l'inscription a été annulée par le Bénévole concerné
  //  ou que la Mission correspondante a été annulée avant qu'elle ne commence pas un des Organisateur
  ANNULEE = 4,
}

export interface IRegistration {
  date: Date;
  recallSendAt?: Date;
  volunteerUuid: string;
  status: RegistrationStatus;
}

