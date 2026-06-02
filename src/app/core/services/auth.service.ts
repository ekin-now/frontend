import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, tap, type Observable } from 'rxjs';

import { TokenService } from './token.service';
import { JwtPayload } from '../models/jwt-payload.model';
import { CreateUserRequest, User } from '../models/user.model';

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly token = inject(TokenService);
  private readonly router = inject(Router);

  private readonly _user = signal<JwtPayload | null>(this.restoreSession());

  readonly currentUser = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  login(credentials: { email: string; password: string }): Observable<void> {
    return this.http
      .post<{ access_token: string }>(`${API}/auth/login`, credentials)
      .pipe(
        tap(({ access_token }) => {
          this.token.set(access_token);
          this._user.set(this.token.getPayload());
        }),
        map(() => void 0),
      );
  }

  register(data: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${API}/users`, data);
  }

  logout(): void {
    this.token.remove();
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private restoreSession(): JwtPayload | null {
    if (this.token.isExpired()) {
      this.token.remove();
      return null;
    }
    return this.token.getPayload();
  }
}
