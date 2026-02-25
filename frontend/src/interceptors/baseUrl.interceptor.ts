import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const isServer = isPlatformServer(platformId);

  if (req.url.startsWith('/')) {
    const baseUrl = isServer ? 'http://backend:3000' : 'http://localhost:3000';
    const apiReq = req.clone({ url: `${baseUrl}${req.url}` });
    return next(apiReq);
  }
  return next(req);
};
