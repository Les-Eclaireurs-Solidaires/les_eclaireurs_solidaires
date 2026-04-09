import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
  withHttpTransferCacheOptions,
} from '@angular/platform-browser';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';
import { GlobalErrorHandler } from './core/exceptions/global-error-handler';
import { httpErrorInterceptor } from './core/interceptors/http-error-interceptor';
import { baseUrlInterceptor } from './core/interceptors/base-url-interceptor';
import { firstValueFrom } from 'rxjs';
import { AuthStateService } from './services/auth-state.service';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    provideClientHydration(
      withEventReplay(),
      withHttpTransferCacheOptions({
        includeRequestsWithAuthHeaders: true,
        includePostRequests: false,
        filter: (req) => !req.url.endsWith('/auth/me'),
      }),
    ),

    provideHttpClient(
      withFetch(),
      withInterceptors([baseUrlInterceptor, httpErrorInterceptor]),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
    ),

    provideAppInitializer(() => {
      const authStateService = inject(AuthStateService);
      return firstValueFrom(authStateService.initializeApp());
    }),
  ],
};
