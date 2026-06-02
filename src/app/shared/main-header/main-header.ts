import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TuiDataList, TuiDropdown } from '@taiga-ui/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...TuiDropdown, ...TuiDataList, RouterLink, RouterLinkActive],
  styles: [`
    :host {
      display: block;
    }

    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      background: rgba(6, 6, 6, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--ek-border);
    }

    .header-logo {
      font-family: var(--ek-font-display);
      font-size: 1.4rem;
      letter-spacing: 0.08em;
      color: var(--ek-text);
      text-decoration: none;
    }

    .header-logo-accent {
      color: var(--ek-accent);
    }

    .header-nav {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .nav-link {
      padding: 0.4rem 0.875rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--ek-text-muted);
      text-decoration: none;
      transition: color 0.15s, background 0.15s;
    }

    .nav-link:hover,
    .nav-link.active {
      color: var(--ek-text);
      background: var(--ek-surface-2);
    }

    .nav-link.active {
      color: var(--ek-accent);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .avatar-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--ek-accent);
      border: none;
      cursor: pointer;
      font-family: var(--ek-font-body);
      font-size: 0.78rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: 0.04em;
      transition: background 0.15s, transform 0.15s;
      flex-shrink: 0;
    }

    .avatar-btn:hover {
      background: var(--ek-accent-hover);
      transform: scale(1.05);
    }

    .user-email {
      font-size: 0.82rem;
      color: var(--ek-text-muted);
      max-width: 160px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .menu-item {
      width: 100%;
      text-align: left;
      font-family: var(--ek-font-body);
      font-size: 0.875rem;
    }

    .menu-item-danger {
      color: var(--tui-text-negative) !important;
    }
  `],
  template: `
    <header class="header">
      <a routerLink="/events" class="header-logo">
        EKI<span class="header-logo-accent">N</span>NOW
      </a>

      <nav class="header-nav" aria-label="Main navigation">
        <a
          routerLink="/events"
          routerLinkActive="active"
          class="nav-link"
          aria-label="Eventos"
        >Eventos</a>
      </nav>

      <div class="header-right">
        <span class="user-email" aria-hidden="true">{{ email() }}</span>

        <button
          type="button"
          class="avatar-btn"
          [tuiDropdown]="userMenu"
          [(tuiDropdownOpen)]="menuOpen"
          [attr.aria-label]="'Menú de ' + email()"
        >
          {{ initials() }}
        </button>

        <ng-template #userMenu>
          <tui-data-list>
            <button
              type="button"
              tuiOption
              class="menu-item"
              routerLink="/profile"
            >Mi perfil</button>
            <button
              type="button"
              tuiOption
              class="menu-item"
              routerLink="/settings"
            >Configuración</button>
            <button
              type="button"
              tuiOption
              class="menu-item menu-item-danger"
              (click)="logout()"
            >Cerrar sesión</button>
          </tui-data-list>
        </ng-template>
      </div>
    </header>
  `,
})
export class MainHeader {
  private readonly auth = inject(AuthService);

  protected readonly menuOpen = signal(false);

  protected readonly email = computed(() => this.auth.currentUser()?.email ?? '');

  protected readonly initials = computed(() => {
    const e = this.email();
    const [local] = e.split('@');
    const parts = local.split(/[._-]/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : local.slice(0, 2).toUpperCase();
  });

  protected logout(): void {
    this.auth.logout();
  }
}
