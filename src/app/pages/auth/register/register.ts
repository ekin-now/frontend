import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { TuiButton } from '@taiga-ui/core';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageSwitcher } from '../../../shared/language-switcher/language-switcher';

const passwordsMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const pw = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { passwordsMismatch: true } : null;
};

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe, TuiButton, LanguageSwitcher],
  styles: [`
    :host {
      display: flex;
      min-height: 100dvh;
      background: var(--ek-bg);
    }

    .auth-visual {
      flex: 0 0 40%;
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
      top: -100px;
      left: -150px;
      background: radial-gradient(circle, rgba(255,101,0,0.18) 0%, transparent 65%);
      filter: blur(100px);
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
      font-size: clamp(3rem, 5vw, 5rem);
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

    .auth-steps {
      margin-top: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .auth-step {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.875rem;
      color: var(--ek-text-muted);
    }

    .auth-step-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--ek-accent);
      flex-shrink: 0;
    }

    .auth-form-side {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 3rem 4rem;
      overflow-y: auto;
    }

    .auth-form-container {
      width: 100%;
      max-width: 440px;
    }

    .auth-form-header {
      margin-bottom: 2rem;
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
      gap: 1.1rem;
    }

    .auth-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .auth-field-label {
      display: block;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ek-text-muted);
      margin-bottom: 0.4rem;
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
      margin-top: 0.3rem;
    }

    .auth-form-error {
      padding: 0.875rem 1rem;
      background: rgba(255, 85, 85, 0.1);
      border: 1px solid rgba(255, 85, 85, 0.3);
      border-radius: 8px;
      font-size: 0.875rem;
      color: var(--tui-text-negative);
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
        border-right: none;
        border-bottom: 1px solid var(--ek-border);
      }

      .auth-big-text {
        font-size: 2.5rem;
      }

      .auth-steps {
        display: none;
      }

      .auth-form-side {
        padding: 2rem 1.5rem;
      }

      .auth-top-bar {
        top: 1.5rem;
        right: 1.5rem;
      }

      .auth-row {
        grid-template-columns: 1fr;
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
          <span>TU</span>
          <span class="auth-big-accent">PRÓXIMA</span>
          <span>VICTORIA</span>
          <span>EMPIEZA</span>
          <span>AQUÍ.</span>
        </p>
        <div class="auth-steps" aria-label="Registration benefits">
          <div class="auth-step">
            <span class="auth-step-dot" aria-hidden="true"></span>
            <span>Acceso a miles de eventos deportivos</span>
          </div>
          <div class="auth-step">
            <span class="auth-step-dot" aria-hidden="true"></span>
            <span>Conecta con atletas de todo el país</span>
          </div>
          <div class="auth-step">
            <span class="auth-step-dot" aria-hidden="true"></span>
            <span>Seguimiento de tu rendimiento</span>
          </div>
        </div>
      </div>
    </aside>

    <section class="auth-form-side" aria-label="Registration form">
      <div class="auth-top-bar">
        <app-language-switcher />
      </div>

      <div class="auth-form-container">
        <header class="auth-form-header">
          <h1 class="auth-form-title">{{ 'auth.registerTitle' | transloco }}</h1>
          <p class="auth-form-subtitle">{{ 'auth.registerSubtitle' | transloco }}</p>
        </header>

        <form class="auth-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="auth-row">
            <div>
              <label class="auth-field-label" for="reg-firstname">{{ 'auth.firstName' | transloco }}</label>
              <input
                id="reg-firstname"
                class="auth-native-input"
                type="text"
                formControlName="firstName"
                autocomplete="given-name"
                [attr.aria-invalid]="isInvalid('firstName')"
              />
              @if (isInvalid('firstName')) {
                <p class="auth-field-error" role="alert">Requerido</p>
              }
            </div>
            <div>
              <label class="auth-field-label" for="reg-lastname">{{ 'auth.lastName' | transloco }}</label>
              <input
                id="reg-lastname"
                class="auth-native-input"
                type="text"
                formControlName="lastName"
                autocomplete="family-name"
                [attr.aria-invalid]="isInvalid('lastName')"
              />
              @if (isInvalid('lastName')) {
                <p class="auth-field-error" role="alert">Requerido</p>
              }
            </div>
          </div>

          <div>
            <label class="auth-field-label" for="reg-email">{{ 'auth.email' | transloco }}</label>
            <input
              id="reg-email"
              class="auth-native-input"
              type="email"
              formControlName="email"
              placeholder="tu@email.com"
              autocomplete="email"
              [attr.aria-invalid]="isInvalid('email')"
              aria-describedby="reg-email-error"
            />
            @if (isInvalid('email')) {
              <p id="reg-email-error" class="auth-field-error" role="alert">
                @if (form.get('email')?.hasError('required')) {
                  El correo es requerido
                } @else if (form.get('email')?.hasError('email')) {
                  Introduce un correo válido
                }
              </p>
            }
          </div>

          <div>
            <label class="auth-field-label" for="reg-password">{{ 'auth.password' | transloco }}</label>
            <input
              id="reg-password"
              class="auth-native-input"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="new-password"
              [attr.aria-invalid]="isInvalid('password')"
              aria-describedby="reg-password-error"
            />
            @if (isInvalid('password')) {
              <p id="reg-password-error" class="auth-field-error" role="alert">
                @if (form.get('password')?.hasError('required')) {
                  La contraseña es requerida
                } @else if (form.get('password')?.hasError('minlength')) {
                  Mínimo 8 caracteres
                }
              </p>
            }
          </div>

          <div>
            <label class="auth-field-label" for="reg-confirm">{{ 'auth.confirmPassword' | transloco }}</label>
            <input
              id="reg-confirm"
              class="auth-native-input"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="confirmPassword"
              autocomplete="new-password"
              [attr.aria-invalid]="isInvalid('confirmPassword') || (form.touched && form.hasError('passwordsMismatch'))"
              aria-describedby="reg-confirm-error"
            />
            @if (form.touched && form.hasError('passwordsMismatch')) {
              <p id="reg-confirm-error" class="auth-field-error" role="alert">Las contraseñas no coinciden</p>
            }
          </div>

          <div style="display:flex; justify-content:flex-end;">
            <button
              type="button"
              style="background:none;border:none;padding:0;font-size:0.82rem;color:var(--ek-text-muted);cursor:pointer;font-family:var(--ek-font-body);"
              (click)="togglePassword()"
            >
              {{ showPassword() ? 'Ocultar' : 'Mostrar' }} contraseñas
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
            {{ loading() ? ('common.loading' | transloco) : ('auth.createAccount' | transloco) }}
          </button>
        </form>

        <div class="auth-divider" aria-hidden="true">
          <span class="auth-divider-line"></span>
          <span class="auth-divider-text">O</span>
          <span class="auth-divider-line"></span>
        </div>

        <p class="auth-switch">
          {{ 'auth.alreadyAccount' | transloco }}&nbsp;
          <a routerLink="/login" class="auth-switch-link">
            {{ 'auth.signIn' | transloco }}
          </a>
        </p>
      </div>
    </section>
  `,
})
export class RegisterPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly showPassword = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.group(
    {
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

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

    const { confirmPassword: _c, ...data } = this.form.getRawValue();

    this.authService.register(data).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.status === 409 ? 'Este correo ya está registrado' : 'Error al crear la cuenta',
        );
      },
    });
  }
}
