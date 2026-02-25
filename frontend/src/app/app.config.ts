import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
  withHttpTransferCacheOptions,
} from '@angular/platform-browser';
import {
  HTTP_TRANSFER_CACHE_ORIGIN_MAP,
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { baseUrlInterceptor } from '../interceptors/baseUrl.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(
      withEventReplay(),
      withHttpTransferCacheOptions({
        includeRequestsWithAuthHeaders: true,
        includePostRequests: false,
      }),
    ),
    provideHttpClient(withFetch(), withInterceptors([baseUrlInterceptor])),
  ],
};
