import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MainHeader } from '../../shared/main-header/main-header';

@Component({
  selector: 'app-events',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MainHeader],
  styles: [`
    :host {
      display: block;
      min-height: 100dvh;
      background: var(--ek-bg);
    }

    .page {
      padding-top: 60px;
    }

    .events-hero {
      padding: 3rem 2rem 2rem;
      border-bottom: 1px solid var(--ek-border);
    }

    .events-title {
      font-family: var(--ek-font-display);
      font-size: clamp(2rem, 4vw, 3rem);
      letter-spacing: 0.04em;
      color: var(--ek-text);
      line-height: 1;
    }

    .events-title-accent {
      color: var(--ek-accent);
    }

    .events-subtitle {
      margin-top: 0.5rem;
      font-size: 0.9rem;
      color: var(--ek-text-muted);
    }

    .events-content {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 6rem 2rem;
      gap: 1rem;
      text-align: center;
    }

    .empty-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--ek-surface-2);
      border: 1px solid var(--ek-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
    }

    .empty-title {
      font-family: var(--ek-font-display);
      font-size: 1.5rem;
      letter-spacing: 0.04em;
      color: var(--ek-text);
    }

    .empty-text {
      font-size: 0.875rem;
      color: var(--ek-text-muted);
      max-width: 320px;
    }
  `],
  template: `
    <app-main-header />

    <main class="page">
      <div class="events-hero">
        <h1 class="events-title">
          PRÓXIMOS <span class="events-title-accent">EVENTOS</span>
        </h1>
        <p class="events-subtitle">Encuentra y apúntate a los eventos deportivos cerca de ti</p>
      </div>

      <div class="events-content">
        <div class="empty-state">
          <div class="empty-icon" aria-hidden="true">🏆</div>
          <p class="empty-title">Sin eventos por ahora</p>
          <p class="empty-text">Pronto aparecerán los próximos eventos deportivos disponibles en tu zona.</p>
        </div>
      </div>
    </main>
  `,
})
export class EventsPage {}
