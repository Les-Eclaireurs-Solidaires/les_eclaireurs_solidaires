import type { Request, Response, NextFunction } from "express";
import { envConfig } from "../../config/EnvConfig.js";
import { DomainError } from "../../../domain/exceptions/DomainError.js";
import { AppError } from "../../exceptions/AppError.js";
import { DtoValidationError } from "../../exceptions/DtoValidationError.js";
import { CSRFError } from "../../exceptions/CSRFError.js";
import { UnauthorizedError } from "../../exceptions/UnauthorizedError.js";
import { EmailAlreadyExistError } from "../../../domain/exceptions/auth/EmailAlreadyExistError.js";
import { UserNotFoundError } from "../../../domain/exceptions/auth/UserNotFoundError.js";
import { InvalidCredentialsError } from "../../../domain/exceptions/auth/InvalidCredentialsError.js";
import { MissionDateError } from "../../../domain/exceptions/mission/MissionDateError.js";
import { MissionFullError } from "../../../domain/exceptions/mission/MissionFullError.js";
import { MissionNameAlreadyExistError } from "../../../domain/exceptions/mission/MissionNameAlreadyExistError.js";
import { MissionNotFoundError } from "../../../domain/exceptions/mission/MissionNotFoundError.js";
import { MissionStatusError } from "../../../domain/exceptions/mission/MissionStatusError.js";
import { MissionVolunteerNotRegisteredError } from "../../../domain/exceptions/mission/MissionVolunteerNotRegisterError.js";
import { OrganizerRegisterError } from "../../../domain/exceptions/mission/OrganizerRegisterError.js";
import { VolunteerRegisterAlreadyExistError } from "../../../domain/exceptions/mission/VolunteerRegisterAlreadyExistError.js";
import { BadRequestError } from "../../exceptions/BadRequestError.js";
import { DataIntegrityError } from "../../exceptions/DataIntegrityError.js";
import { EmptyUpdateError } from "../../exceptions/EmptyUpdateError.js";
import { UnauthenticatedError } from "../../exceptions/UnauthenticatedError.js";
import { UnauthorizedCancelRegistrationError } from "../../../domain/exceptions/registration/UnauthorizedCancelRegistrationError.js";
import { InvalidTokenError } from "../../../domain/exceptions/auth/InvalidTokenError.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (envConfig.nodeEnv !== "test") {
    console.error(
      `[ERROR] ${req.method} ${req.url} >> ${err.name}: ${err.message}`,
    );
    if (!(err instanceof DomainError) && !(err instanceof AppError)) {
      console.error(err.stack);
    }
  }

  if (err instanceof AppError) {
    if (err instanceof BadRequestError) {
      return res.status(400).json({ message: err.message });
    }
    if (err instanceof DataIntegrityError) {
      return res.status(400).json({ message: err.message });
    }
    if (err instanceof EmptyUpdateError) {
      return res.status(400).json({ message: err.message });
    }
    if (err instanceof DtoValidationError) {
      return res.status(400).json({ message: err.message, errors: err.errors });
    }
    if (err instanceof CSRFError) {
      return res.status(403).json({ message: err.message });
    }
    if (err instanceof UnauthorizedError) {
      return res.status(403).json({ message: err.message });
    }
    if (err instanceof UnauthenticatedError) {
      return res.status(401).json({ message: err.message });
    }
  }

  if (err instanceof DomainError) {
    if (err instanceof EmailAlreadyExistError) {
      return res.status(409).json({ message: err.message });
    }
    if (err instanceof UserNotFoundError) {
      return res.status(404).json({ message: err.message });
    }
    if (err instanceof InvalidCredentialsError) {
      return res.status(400).json({ message: err.message });
    }
    if (err instanceof InvalidTokenError) {
      return res.status(401).json({ message: err.message });
    }
    if (err instanceof MissionDateError) {
      return res.status(400).json({ message: err.message });
    }
    if (err instanceof MissionFullError) {
      return res.status(400).json({ message: err.message });
    }
    if (err instanceof MissionNameAlreadyExistError) {
      return res.status(400).json({ message: err.message });
    }
    if (err instanceof MissionNotFoundError) {
      return res.status(400).json({ message: err.message });
    }
    if (err instanceof MissionStatusError) {
      return res.status(400).json({ message: err.message });
    }
    if (err instanceof MissionVolunteerNotRegisteredError) {
      return res.status(400).json({ message: err.message });
    }
    if (err instanceof OrganizerRegisterError) {
      return res.status(400).json({ message: err.message });
    }
    if (err instanceof VolunteerRegisterAlreadyExistError) {
      return res.status(400).json({ message: err.message });
    }
    if (err instanceof UnauthorizedCancelRegistrationError) {
      return res.status(400).json({ message: err.message });
    }
  }

  // 3. ERREUR SERVEUR NON GEREE (Crash)
  return res.status(500).json({
    message: "Erreur interne du serveur.",
    stack: envConfig.nodeEnv === "development" ? err.stack : undefined,
  });
};
