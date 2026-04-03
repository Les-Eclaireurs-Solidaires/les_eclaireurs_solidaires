export enum RegistrationStatus {
  // Signifie que l'inscription a la Mission est en attente de validation d'un Organisateur
  ONHOLD = 1,
  // Signifie que l'inscription a la Mission est validée par un organisateur
  VALIDATED = 2,
  // Signifie que l'inscription a la Mission est refusée par un organisateur
  REFUSED = 3,
  // Signifie que l'inscription a été annulée par le Bénévole concerné
  //  ou que la Mission correspondante a été annulée avant qu'elle ne commence pas un des Organisateur
  CANCELLED = 4,
  PRESENT = 5,
  ABSENT = 6
}
