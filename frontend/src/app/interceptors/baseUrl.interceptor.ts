import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID, REQUEST } from '@angular/core';
import { isPlatformServer } from '@angular/common';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const isServer = isPlatformServer(platformId);

  if (req.url.startsWith('/')) {
    const baseUrl = isServer ? 'http://backend:3000' : 'http://localhost:3000';
    let headers = req.headers;

    if (isServer) {
      const serverRequest = inject(REQUEST, { optional: true });
      const cookie = serverRequest?.headers.get('cookie');
      if (cookie) {
        headers = headers.set('cookie', cookie);
      }
    }

    return next(req.clone({ url: `${baseUrl}${req.url}`, headers }));
  }

  return next(req);
};
