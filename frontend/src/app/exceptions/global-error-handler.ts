import { ErrorHandler, inject } from '@angular/core';
import { NotificationService } from '../services/notification.service';
import { InvalidUserRoleError } from './invalid-user-role-error';

export class GlobalErrorHandler implements ErrorHandler {
  private notifService = inject(NotificationService);

  handleError(error: any): void {
    if (error instanceof Error) {
      if(error instanceof InvalidUserRoleError)
      {
        return this.notifService.showError(error.message);
      }
    }

    console.error(error);
    return this.notifService.showError("Une erreur inattendue est survenue.");
  }
}
