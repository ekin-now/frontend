import { LowerCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { TuiButton, TuiInput } from '@taiga-ui/core';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageSwitcher } from '../../../shared/language-switcher/language-switcher';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe, LowerCasePipe, TuiButton, TuiInput, LanguageSwitcher],
  styles: [`
    :host {
      display: flex;
      min-height: 100dvh;
      background: var(--ek-bg);
    }

    .auth-visual {
      flex: 0 0 45%;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 3rem;
      background: var(--ek-surface);
      border-right: 1px solid var(--ek-border);
      overflow: hidden;
    }

    .auth-visual-bg {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle, rgba(255,101,0,0.12) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
    }

    .auth-visual-glow {
      position: absolute;
      width: 500px;
      height: 500px;
      bottom: -150px;
      right: -150px;
      background: radial-gradient(circle, rgba(255,101,0,0.2) 0%, transparent 65%);
      filter: blur(80px);
      pointer-events: none;
    }

    .auth-visual-brand {
      position: relative;
      z-index: 1;
    }

    .auth-logo {
      font-family: var(--ek-font-display);
      font-size: 2rem;
      letter-spacing: 0.08em;
      color: var(--ek-text);
    }

    .auth-logo-accent {
      color: var(--ek-accent);
    }

    .auth-visual-headline {
      position: relative;
      z-index: 1;
    }

    .auth-big-text {
      font-family: var(--ek-font-display);
      font-size: clamp(3.5rem, 6vw, 5.5rem);
      line-height: 0.92;
      letter-spacing: 0.02em;
      color: var(--ek-text);
      display: flex;
      flex-direction: column;
      gap: 0.1em;
    }

    .auth-big-accent {
      color: var(--ek-accent);
    }

    .auth-tagline {
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: var(--ek-text-muted);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .auth-form-side {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 3rem 4rem;
    }

    .auth-form-container {
      width: 100%;
      max-width: 400px;
    }

    .auth-form-header {
      margin-bottom: 2.5rem;
    }

    .auth-form-title {
      font-family: var(--ek-font-display);
      font-size: 2.5rem;
      letter-spacing: 0.04em;
      color: var(--ek-text);
      line-height: 1;
      margin-bottom: 0.5rem;
    }

    .auth-form-subtitle {
      font-size: 0.9rem;
      color: var(--ek-text-muted);
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .auth-field-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ek-text-muted);
      margin-bottom: 0.5rem;
    }

    .auth-native-input {
      width: 100%;
      padding: 0.875rem 1rem;
      background: var(--ek-surface-2);
      border: 1px solid var(--ek-border);
      border-radius: 8px;
      color: var(--ek-text);
      font-family: var(--ek-font-body);
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s, background 0.2s;
    }

    .auth-native-input:focus {
      border-color: var(--ek-accent);
      background: var(--ek-surface-3);
    }

    .auth-native-input::placeholder {
      color: var(--ek-text-dim);
    }

    .auth-field-error {
      font-size: 0.78rem;
      color: var(--tui-text-negative);
      margin-top: 0.35rem;
    }

    .auth-forgot {
      text-align: right;
      font-size: 0.82rem;
      color: var(--ek-text-muted);
      cursor: pointer;
      transition: color 0.2s;
      background: none;
      border: none;
      padding: 0;
    }

    .auth-forgot:hover {
      color: var(--ek-accent);
    }

    .auth-submit {
      width: 100%;
      background: var(--ek-accent) !important;
      color: #fff !important;
      border: none !important;
      font-family: var(--ek-font-body) !important;
      font-weight: 700 !important;
      font-size: 0.95rem !important;
      letter-spacing: 0.04em;
      margin-top: 0.5rem;
      transition: background 0.2s !important;
    }

    .auth-submit:hover {
      background: var(--ek-accent-hover) !important;
    }

    .auth-submit:disabled {
      opacity: 0.5 !important;
      cursor: not-allowed !important;
    }

    .auth-divider {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 1rem 0;
    }

    .auth-divider-line {
      flex: 1;
      height: 1px;
      background: var(--ek-border);
    }

    .auth-divider-text {
      font-size: 0.78rem;
      color: var(--ek-text-dim);
      letter-spacing: 0.06em;
    }

    .auth-switch {
      text-align: center;
      font-size: 0.875rem;
      color: var(--ek-text-muted);
    }

    .auth-switch-link {
      color: var(--ek-accent);
      font-weight: 600;
      cursor: pointer;
      background: none;
      border: none;
      padding: 0;
      font-size: inherit;
      transition: color 0.2s;
    }

    .auth-switch-link:hover {
      color: var(--ek-accent-hover);
    }

    .auth-top-bar {
      position: absolute;
      top: 3rem;
      right: 3rem;
      z-index: 10;
    }

    @media (max-width: 768px) {
      :host {
        flex-direction: column;
      }

      .auth-visual {
        flex: 0 0 auto;
        padding: 2rem;
        min-height: 200px;
        border-right: none;
        border-bottom: 1px solid var(--ek-border);
      }

      .auth-big-text {
        font-size: 2.5rem;
      }

      .auth-form-side {
        padding: 2rem 1.5rem;
      }

      .auth-top-bar {
        top: 1.5rem;
        right: 1.5rem;
      }
    }
  `],
  template: `
    <aside class="auth-visual">
      <div class="auth-visual-bg" aria-hidden="true"></div>
      <div class="auth-visual-glow" aria-hidden="true"></div>

      <div class="auth-visual-brand">
        <span class="auth-logo">EKI<span class="auth-logo-accent">N</span>NOW</span>
      </div>

      <div class="auth-visual-headline">
        <p class="auth-big-text">
          <span>COMPITE.</span>
          <span class="auth-big-accent">CONECTA.</span>
          <span>TRIUNFA.</span>
        </p>
        <p class="auth-tagline">{{ 'landing.tagline' | transloco }}</p>
      </div>
    </aside>

    <section class="auth-form-side" aria-label="Login form">
      <div class="auth-top-bar">
        <app-language-switcher />
      </div>

      <div class="auth-form-container">
        <header class="auth-form-header">
          <h1 class="auth-form-title">{{ 'auth.welcomeBack' | transloco }}</h1>
          <p class="auth-form-subtitle">{{ 'auth.loginSubtitle' | transloco }}</p>
        </header>

        <form class="auth-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div>
            <label class="auth-field-label" for="login-email">{{ 'auth.email' | transloco }}</label>
            <input
              id="login-email"
              class="auth-native-input"
              type="email"
              formControlName="email"
              placeholder="tu@email.com"
              autocomplete="email"
              [attr.aria-invalid]="isInvalid('email')"
              aria-describedby="login-email-error"
            />
            @if (isInvalid('email')) {
              <p id="login-email-error" class="auth-field-error" role="alert">
                @if (form.get('email')?.hasError('required')) {
                  El correo es requerido
                } @else if (form.get('email')?.hasError('email')) {
                  Introduce un correo válido
                }
              </p>
            }
          </div>

          <div>
            <label class="auth-field-label" for="login-password">{{ 'auth.password' | transloco }}</label>
            <input
              id="login-password"
              class="auth-native-input"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="current-password"
              [attr.aria-invalid]="isInvalid('password')"
              aria-describedby="login-password-error"
            />
            @if (isInvalid('password')) {
              <p id="login-password-error" class="auth-field-error" role="alert">
                La contraseña es requerida
              </p>
            }
          </div>

          <div style="display:flex; justify-content:flex-end;">
            <button
              type="button"
              class="auth-forgot"
              (click)="togglePassword()"
              [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            >
              {{ showPassword() ? 'Ocultar' : 'Mostrar' }} {{ 'auth.password' | transloco | lowercase }}
            </button>
          </div>

          @if (errorMessage()) {
            <p class="auth-field-error" role="alert" style="text-align:center;">{{ errorMessage() }}</p>
          }

          <button
            type="submit"
            tuiButton
            size="l"
            class="auth-submit"
            [disabled]="form.invalid || loading()"
          >
            {{ loading() ? ('common.loading' | transloco) : ('auth.login' | transloco) }}
          </button>
        </form>

        <div class="auth-divider" aria-hidden="true">
          <span class="auth-divider-line"></span>
          <span class="auth-divider-text">O</span>
          <span class="auth-divider-line"></span>
        </div>

        <p class="auth-switch">
          {{ 'auth.noAccount' | transloco }}&nbsp;
          <a routerLink="/register" class="auth-switch-link">
            {{ 'auth.createAccount' | transloco }}
          </a>
        </p>
      </div>
    </section>
  `,
})
export class LoginPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly showPassword = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control.touched);
  }

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/events']),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.status === 401 ? 'Credenciales incorrectas' : 'Error al iniciar sesión',
        );
      },
    });
  }
}
