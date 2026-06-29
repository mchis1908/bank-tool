import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let accountId = '';
    try {
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || 'null');
      if (adminUser && adminUser.username) {
        accountId = adminUser.username;
      }
    } catch (e) {
      // Ignore parsing errors
    }

    if (accountId) {
      const cloned = request.clone({
        setHeaders: {
          'X-Account-Id': accountId
        }
      });
      return next.handle(cloned);
    }

    return next.handle(request);
  }
}
