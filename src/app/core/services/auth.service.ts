// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface LoginResponse {
  token: string;
  user: { username: string; displayName: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY = 'jwt_token';
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(res => this.saveToken(res.token))
    );
  }

  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decode payload (phần giữa của JWT) – không cần thư viện ngoài
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp > now;
    } catch {
      return false;
    }
  }

  private saveToken(token: string): void {
    // Dùng sessionStorage thay localStorage:
    // - Tự xoá khi đóng tab/trình duyệt
    // - Không chia sẻ giữa các tab khác
    // - Không thể bị set từ console trong tab khác
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }
}
