// app.config.server.ts
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { HTTP_TRANSFER_CACHE_ORIGIN_MAP } from '@angular/common/http';
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { environment } from '../environment/environment';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    {
      provide: HTTP_TRANSFER_CACHE_ORIGIN_MAP,
      useValue: {
        [environment.apiUrlServer] : environment.apiUrlClient,
      },
    },

    provideClientHydration(
      withEventReplay(),
      withHttpTransferCacheOptions({
        includeRequestsWithAuthHeaders: true,
        includePostRequests: false,
      }),
    )
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);