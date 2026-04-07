import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  PLATFORM_ID,
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
import { GlobalErrorHandler } from './exceptions/global-error-handler';
import { httpErrorInterceptor } from './interceptors/http-error-interceptor';
import { firstValueFrom, tap } from 'rxjs';
import { baseUrlInterceptor } from './interceptors/base-url-interceptor';
import { isPlatformBrowser } from '@angular/common';
import { UserStateService } from './services/user-state.service';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
    provideAppInitializer(() => {
      const userStateService = inject(UserStateService);
      const platformId = inject(PLATFORM_ID);
      if (isPlatformBrowser(platformId)) {
        return firstValueFrom(userStateService.initialize()).catch(() => null);
      }
      return Promise.resolve();
    }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(
      withEventReplay(),
      withHttpTransferCacheOptions({
        includeRequestsWithAuthHeaders: true,
        includePostRequests: false,
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
  ],
};
