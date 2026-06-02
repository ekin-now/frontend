import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { JwtPayload } from '../models/jwt-payload.model';

const TOKEN_KEY = 'ek_token';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  set(token: string): void {
    if (this.isBrowser) localStorage.setItem(TOKEN_KEY, token);
  }

  get(): string | null {
    return this.isBrowser ? localStorage.getItem(TOKEN_KEY) : null;
  }

  remove(): void {
    if (this.isBrowser) localStorage.removeItem(TOKEN_KEY);
  }

  getPayload(): JwtPayload | null {
    const token = this.get();
    if (!token) return null;
    try {
      const payloadB64 = token.split('.')[1];
      return JSON.parse(atob(payloadB64)) as JwtPayload;
    } catch {
      return null;
    }
  }

  isExpired(): boolean {
    const payload = this.getPayload();
    if (!payload?.exp) return true;
    return Date.now() >= payload.exp * 1000;
  }
}
