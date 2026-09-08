import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse } from '../../models/auth';

const TOKEN_KEY = 'kvdys_auth_token';
const USER_KEY = 'kvdys_auth_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = 'http://localhost:8080/api/v1/auth';

  readonly currentUser = signal<LoginResponse | null>(this.getStoredUser());
  readonly isLoggedIn = computed(() => !!this.currentUser());
  readonly username = computed(() => this.currentUser()?.username ?? '');
  readonly email = computed(() => this.currentUser()?.email ?? '');
  readonly avatarUrl = computed(() => this.currentUser()?.avatarUrl ?? null);
  readonly roles = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      return user.roles;
    }
    const token = user.token || this.getToken();
    return this.getRolesFromToken(token);
  });
  readonly isAdmin = computed(() => this.hasRole('ROLE_ADMIN'));
  readonly userId = computed(() => this.currentUser()?.userId ?? null);

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap((response) => {
        this.saveAuthData(response);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  hasRole(role: string): boolean {
    const currentRoles = this.roles();
    const cleanRole = role.replace(/^ROLE_/, '');
    return currentRoles.includes(role) ||
           currentRoles.includes(`ROLE_${cleanRole}`) ||
           currentRoles.includes(cleanRole);
  }

  updateStoredEmail(email: string): void {
    const user = this.currentUser();
    if (user) {
      const updated = { ...user, email };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      this.currentUser.set(updated);
    }
  }

  updateStoredAvatarUrl(avatarUrl: string | null): void {
    const user = this.currentUser();
    if (user) {
      const updated = { ...user, avatarUrl };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      this.currentUser.set(updated);
    }
  }

  private decodeJwtPayload(token: string | null): any {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }
      const jsonStr = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonStr);
    } catch {
      try {
        return JSON.parse(atob(token.split('.')[1]));
      } catch {
        return null;
      }
    }
  }

  private getRolesFromToken(token: string | null): string[] {
    const payload = this.decodeJwtPayload(token);
    return payload?.roles ?? [];
  }

  private saveAuthData(data: LoginResponse): void {
    try {
      if (!data.roles || data.roles.length === 0) {
        data.roles = this.getRolesFromToken(data.token);
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data));
      this.currentUser.set(data);
    } catch (e) {
      console.error('Error saving auth data to localStorage', e);
    }
  }

  private getStoredUser(): LoginResponse | null {
    try {
      const stored = localStorage.getItem(USER_KEY);
      const token = localStorage.getItem(TOKEN_KEY);
      if (!stored || !token) return null;

      // Clear session if token is expired — prevents ghost login state on startup
      if (this.isTokenExpired(token)) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return null;
      }

      const user = JSON.parse(stored) as LoginResponse;
      if (!user.roles || user.roles.length === 0) {
        user.roles = this.getRolesFromToken(token);
      }
      return user;
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeJwtPayload(token);
    if (!payload || !payload.exp) return true;
    return payload.exp * 1000 < Date.now();
  }
}
