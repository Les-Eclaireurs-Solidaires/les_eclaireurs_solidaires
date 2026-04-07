export enum RegistrationStatus {
  // Indicates that the registration for the Mission is awaiting validation from an Organizer
  ONHOLD = 1,
  // Indicates that the registration for the Mission has been validated by an organizer
  VALIDATED = 2,
  // Indicates that the registration for the Mission has been refused by an organizer
  REFUSED = 3,
  // Indicates that the registration was canceled by the Volunteer or
  // that the corresponding Mission was canceled before it started by an Organizer
  CANCELED = 4,
  PRESENT = 5,
  ABSENT = 6,
}
