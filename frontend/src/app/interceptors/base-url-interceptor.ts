import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { REQUEST } from '@angular/core';
import { environment } from '../../environment/environment';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const isServer = isPlatformServer(platformId);

  if (req.url.startsWith('/api')) {
    const baseUrl = isServer ? environment.apiUrlServer : environment.apiUrlClient;
    let headers = req.headers;

    if (isServer) {
      const serverRequest = inject(REQUEST, { optional: true }) as any;
      const cookie = serverRequest?.headers?.get?.('cookie') || serverRequest?.headers?.cookie;

      if (cookie) {
        headers = headers.set('cookie', cookie);
      }
    }

    const apiReq = req.clone({
      url: `${baseUrl}${req.url}`,
      headers,
    });

    return next(apiReq);
  }

  return next(req);
};
