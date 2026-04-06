import type { Request, Response, NextFunction } from "express";
import { envConfig } from "../../config/EnvConfig.js";
import { DomainError } from "../../../domain/DomainError.js";
import { AppError } from "../../exceptions/AppError.js";
import { DtoValidationError } from "../../exceptions/DtoValidationError.js";
import { CSRFError } from "../../exceptions/CSRFError.js";
import { UnauthorizedError } from "../../exceptions/UnauthorizedError.js";
import { BadRequestError } from "../../exceptions/BadRequestError.js";
import { DataIntegrityError } from "../../exceptions/DataIntegrityError.js";
import { EmptyUpdateError } from "../../exceptions/EmptyUpdateError.js";
import { UnauthenticatedError } from "../../exceptions/UnauthenticatedError.js";
import { EmailAlreadyExistError } from "../../../domain/authentication/exceptions/EmailAlreadyExistError.js";
import { UserNotFoundError } from "../../../domain/user/exceptions/UserNotFoundError.js";
import { InvalidTokenError } from "../../../domain/authentication/exceptions/InvalidTokenError.js";
import { MissionDateError } from "../../../domain/mission/exceptions/MissionDateError.js";
import { InvalidCredentialsError } from "../../../domain/authentication/exceptions/InvalidCredentialsError.js";
import { UnauthorizedCancelRegistrationError } from "../../../domain/registration/exceptions/UnauthorizedCancelRegistrationError.js";
import { VolunteerRegisterAlreadyExistError } from "../../../domain/mission/exceptions/VolunteerRegisterAlreadyExistError.js";
import { OrganizerRegisterError } from "../../../domain/mission/exceptions/OrganizerRegisterError.js";
import { MissionVolunteerNotRegisteredError } from "../../../domain/mission/exceptions/MissionVolunteerNotRegisterError.js";
import { MissionStatusError } from "../../../domain/mission/exceptions/MissionStatusError.js";
import { MissionNotFoundError } from "../../../domain/mission/exceptions/MissionNotFoundError.js";
import { MissionNameAlreadyExistError } from "../../../domain/mission/exceptions/MissionNameAlreadyExistError.js";
import { MissionFullError } from "../../../domain/mission/exceptions/MissionFullError.js";

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
      return res.status(404).json({ message: err.message });
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

  return res.status(500).json({
    message: "Erreur interne du serveur.",
    stack: envConfig.nodeEnv === "development" ? err.stack : undefined,
  });
};
