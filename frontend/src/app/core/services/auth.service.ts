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
  readonly roles = computed(() => this.getRolesFromToken(this.getToken()));
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
    return currentRoles.includes(role) || currentRoles.includes(`ROLE_${role}`);
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

  private getRolesFromToken(token: string | null): string[] {
    if (!token) return [];
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.roles ?? [];
    } catch {
      return [];
    }
  }

  private saveAuthData(data: LoginResponse): void {
    try {
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

      return JSON.parse(stored) as LoginResponse;
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // exp is in seconds, Date.now() is in milliseconds
      return payload.exp * 1000 < Date.now();
    } catch {
      // If we can't decode it, treat it as expired
      return true;
    }
  }
}
