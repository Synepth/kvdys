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
  readonly roles = computed(() => this.currentUser()?.roles ?? []);
  readonly isAdmin = computed(() => this.hasRole('ROLE_ADMIN'));

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
      return stored ? (JSON.parse(stored) as LoginResponse) : null;
    } catch {
      return null;
    }
  }
}
