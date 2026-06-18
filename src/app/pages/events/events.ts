import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { MainHeader } from '../../shared/main-header/main-header';
import { EventsService } from '../../core/services/events.service';
import { SportEvent } from '../../core/models/sport-event.model';

@Component({
  selector: 'app-events',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MainHeader, DatePipe],
  styles: [
    `
      :host {
        display: block;
        min-height: 100dvh;
        background: var(--ek-bg);
      }

      .page {
        padding-top: 60px;
      }

      /* ─── Hero ─────────────────────────────────────────────── */
      .hero {
        position: relative;
        padding: 3.5rem 2rem 2.5rem;
        border-bottom: 1px solid var(--ek-border);
        overflow: hidden;
      }

      .hero::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(
          ellipse 70% 80% at 0% 120%,
          rgba(255, 101, 0, 0.07) 0%,
          transparent 70%
        );
        pointer-events: none;
      }

      .hero-inner {
        position: relative;
        max-width: 1280px;
        margin: 0 auto;
      }

      .hero-eyebrow {
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.18em;
        color: var(--ek-accent);
        text-transform: uppercase;
        margin-bottom: 0.75rem;
      }

      .hero-title {
        font-family: var(--ek-font-display);
        font-size: clamp(3rem, 7vw, 5.5rem);
        line-height: 0.92;
        letter-spacing: 0.02em;
        color: var(--ek-text);
      }

      .hero-title-accent {
        color: var(--ek-accent);
        display: block;
      }

      .hero-bottom {
        margin-top: 1.25rem;
        display: flex;
        align-items: center;
        gap: 2rem;
        flex-wrap: wrap;
      }

      .hero-subtitle {
        font-size: 0.875rem;
        color: var(--ek-text-muted);
        flex: 1;
        min-width: 200px;
      }

      .hero-stats {
        display: flex;
        gap: 0;
        align-items: center;
        flex-shrink: 0;
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0 1.25rem;
        border-right: 1px solid var(--ek-border);
      }

      .stat-item:first-child {
        padding-left: 0;
      }

      .stat-item:last-child {
        border-right: none;
        padding-right: 0;
      }

      .stat-number {
        font-family: var(--ek-font-display);
        font-size: 1.5rem;
        letter-spacing: 0.04em;
        color: var(--ek-text);
        line-height: 1;
      }

      .stat-label {
        font-size: 0.6rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--ek-text-muted);
        margin-top: 0.15rem;
      }

      /* ─── Filters ───────────────────────────────────────────── */
      .filters {
        position: sticky;
        top: 60px;
        z-index: 50;
        background: rgba(6, 6, 6, 0.96);
        backdrop-filter: blur(16px);
        border-bottom: 1px solid var(--ek-border);
      }

      /* Sport chips row */
      .filters-sports {
        padding: 0.75rem 2rem;
        border-bottom: 1px solid var(--ek-border);
        overflow-x: auto;
        scrollbar-width: none;
      }

      .filters-sports::-webkit-scrollbar {
        display: none;
      }

      .chips-row {
        display: flex;
        gap: 0.4rem;
        width: max-content;
      }

      .chip {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        background: var(--ek-surface-2);
        border: 1px solid var(--ek-border);
        color: var(--ek-text-muted);
        font-family: var(--ek-font-body);
        font-size: 0.72rem;
        font-weight: 600;
        padding: 0.3rem 0.8rem;
        border-radius: 100px;
        cursor: pointer;
        transition: all 0.15s;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .chip:hover {
        border-color: rgba(255, 101, 0, 0.5);
        color: var(--ek-text);
      }

      .chip-active {
        background: var(--ek-accent);
        border-color: var(--ek-accent);
        color: #fff;
      }

      .chip-active:hover {
        background: var(--ek-accent-hover);
        border-color: var(--ek-accent-hover);
        color: #fff;
      }

      .chip-emoji {
        font-size: 0.9rem;
      }

      /* Location + date row */
      .filters-row {
        padding: 0.6rem 2rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .fgroup {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }

      .flabel {
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        color: var(--ek-text-dim);
        text-transform: uppercase;
        white-space: nowrap;
      }

      .fselect,
      .fdate {
        background: var(--ek-surface-2);
        border: 1px solid var(--ek-border);
        color: var(--ek-text);
        font-family: var(--ek-font-body);
        font-size: 0.78rem;
        padding: 0.3rem 0.6rem;
        border-radius: 4px;
        cursor: pointer;
        outline: none;
        transition: border-color 0.15s;
      }

      .fselect {
        min-width: 110px;
      }

      .fdate {
        color-scheme: dark;
      }

      .fselect:focus,
      .fdate:focus {
        border-color: var(--ek-accent);
      }

      .fselect:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }

      .fdivider {
        width: 1px;
        height: 20px;
        background: var(--ek-border);
        flex-shrink: 0;
      }

      .fspacer {
        flex: 1;
      }

      .fclear {
        background: none;
        border: none;
        color: var(--ek-text-muted);
        font-family: var(--ek-font-body);
        font-size: 0.72rem;
        font-weight: 600;
        padding: 0.3rem 0.6rem;
        border-radius: 4px;
        cursor: pointer;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        transition: color 0.15s;
        white-space: nowrap;
      }

      .fclear:hover {
        color: var(--ek-accent);
      }

      /* ─── Content ───────────────────────────────────────────── */
      .content {
        padding: 2rem;
        max-width: 1280px;
        margin: 0 auto;
      }

      .content-header {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }

      .results-label {
        font-size: 0.78rem;
        color: var(--ek-text-muted);
        letter-spacing: 0.04em;
      }

      .results-label strong {
        color: var(--ek-text);
        font-weight: 700;
        font-size: 0.9rem;
      }

      /* ─── Grid ──────────────────────────────────────────────── */
      .events-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
      }

      /* ─── Event card ─────────────────────────────────────────── */
      .event-card {
        background: var(--ek-surface);
        border: 1px solid var(--ek-border);
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transition:
          border-color 0.2s,
          box-shadow 0.2s,
          transform 0.2s;
        cursor: pointer;
      }

      .event-card:hover {
        border-color: rgba(255, 101, 0, 0.5);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        transform: translateY(-2px);
      }

      .event-card-featured {
        border-color: rgba(255, 101, 0, 0.25);
        box-shadow: 0 0 0 1px rgba(255, 101, 0, 0.08) inset;
      }

      .event-card-featured:hover {
        border-color: var(--ek-accent);
        box-shadow:
          0 0 0 1px rgba(255, 101, 0, 0.15) inset,
          0 8px 32px rgba(255, 101, 0, 0.08);
      }

      /* Banner */
      .card-banner {
        position: relative;
        aspect-ratio: 16 / 8;
        overflow: hidden;
        background: var(--ek-surface-2);
        flex-shrink: 0;
      }

      .card-banner img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: transform 0.4s ease;
      }

      .event-card:hover .card-banner img {
        transform: scale(1.03);
      }

      .card-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      .placeholder-bg {
        position: absolute;
        inset: 0;
      }

      .placeholder-emoji {
        position: relative;
        font-size: 3rem;
        filter: grayscale(0.3);
        opacity: 0.6;
        transition: opacity 0.2s;
      }

      .event-card:hover .placeholder-emoji {
        opacity: 0.85;
      }

      /* Gradient overlay on banner */
      .banner-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          to bottom,
          transparent 30%,
          rgba(6, 6, 6, 0.85) 100%
        );
        pointer-events: none;
      }

      /* Top badges on banner */
      .banner-badges {
        position: absolute;
        top: 0.6rem;
        left: 0.6rem;
        display: flex;
        gap: 0.35rem;
        align-items: center;
      }

      .badge-sport {
        background: rgba(6, 6, 6, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: var(--ek-accent);
        font-size: 0.6rem;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        padding: 0.2rem 0.5rem;
        border-radius: 3px;
        backdrop-filter: blur(8px);
      }

      .badge-featured {
        background: var(--ek-accent);
        color: #fff;
        font-size: 0.6rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 0.2rem 0.5rem;
        border-radius: 3px;
      }

      /* Date widget — bottom-left of banner */
      .card-date-box {
        position: absolute;
        bottom: 0.75rem;
        right: 0.75rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(6, 6, 6, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 5px;
        padding: 0.4rem 0.65rem 0.3rem;
        backdrop-filter: blur(12px);
        min-width: 46px;
        line-height: 1;
      }

      .date-day {
        font-family: var(--ek-font-display);
        font-size: 1.6rem;
        color: #fff;
        letter-spacing: 0.02em;
      }

      .date-month {
        font-size: 0.55rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--ek-accent);
        margin-top: -0.1rem;
      }

      /* Card body */
      .card-body {
        padding: 1rem 1.1rem 0.75rem;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .card-title {
        font-family: var(--ek-font-display);
        font-size: 1.2rem;
        letter-spacing: 0.04em;
        color: var(--ek-text);
        line-height: 1.1;
      }

      .card-location {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.78rem;
        color: var(--ek-text-muted);
      }

      .card-location svg {
        flex-shrink: 0;
        opacity: 0.6;
      }

      .card-desc {
        font-size: 0.78rem;
        color: var(--ek-text-muted);
        line-height: 1.55;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        flex: 1;
      }

      /* Card footer */
      .card-footer {
        padding: 0.65rem 1.1rem;
        border-top: 1px solid var(--ek-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }

      .status-badge {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .status-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .card-cta {
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--ek-text-dim);
        transition: color 0.15s;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .event-card:hover .card-cta {
        color: var(--ek-accent);
      }

      /* ─── Skeletons ──────────────────────────────────────────── */
      .skeleton-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
      }

      .skeleton-card {
        background: var(--ek-surface);
        border: 1px solid var(--ek-border);
        border-radius: 8px;
        overflow: hidden;
      }

      .skeleton-banner {
        aspect-ratio: 16 / 8;
        background: var(--ek-surface-2);
        animation: shimmer 1.8s ease-in-out infinite;
      }

      .skeleton-body {
        padding: 1rem 1.1rem;
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
      }

      .skeleton-line {
        border-radius: 3px;
        background: var(--ek-surface-3);
        animation: shimmer 1.8s ease-in-out infinite;
      }

      @keyframes shimmer {
        0%,
        100% {
          opacity: 0.6;
        }
        50% {
          opacity: 0.3;
        }
      }

      /* ─── Empty state ────────────────────────────────────────── */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 6rem 2rem;
        gap: 0.75rem;
        text-align: center;
      }

      .empty-icon {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--ek-surface-2);
        border: 1px solid var(--ek-border);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.6rem;
        margin-bottom: 0.25rem;
      }

      .empty-title {
        font-family: var(--ek-font-display);
        font-size: 1.5rem;
        letter-spacing: 0.04em;
        color: var(--ek-text);
      }

      .empty-text {
        font-size: 0.85rem;
        color: var(--ek-text-muted);
        max-width: 280px;
        line-height: 1.5;
      }

      .empty-clear {
        margin-top: 0.5rem;
        background: none;
        border: 1px solid var(--ek-accent);
        color: var(--ek-accent);
        font-family: var(--ek-font-body);
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 0.5rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.15s;
      }

      .empty-clear:hover {
        background: var(--ek-accent);
        color: #fff;
      }

      /* ─── Responsive ─────────────────────────────────────────── */
      @media (max-width: 768px) {
        .hero {
          padding: 2rem 1rem 1.75rem;
        }

        .hero-bottom {
          gap: 1.25rem;
        }

        .filters-sports,
        .filters-row {
          padding-left: 1rem;
          padding-right: 1rem;
        }

        .content {
          padding: 1.5rem 1rem;
        }

        .hero-stats {
          display: none;
        }
      }
    `,
  ],
  template: `
    <app-main-header />

    <main class="page">
      <!-- ── Hero ──────────────────────────────────────────── -->
      <section class="hero" aria-label="Eventos deportivos">
        <div class="hero-inner">
          <p class="hero-eyebrow">La plataforma de eventos deportivos</p>
          <h1 class="hero-title">
            PRÓXIMOS
            <span class="hero-title-accent">EVENTOS</span>
          </h1>
          <div class="hero-bottom">
            <p class="hero-subtitle">
              Encuentra y apúntate a los eventos deportivos cerca de ti
            </p>
            @if (!loadingEvents() && events().length > 0) {
              <div class="hero-stats" aria-label="Estadísticas">
                <div class="stat-item">
                  <span class="stat-number">{{ events().length }}</span>
                  <span class="stat-label">Eventos</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ uniqueSportCount() }}</span>
                  <span class="stat-label">Deportes</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ uniqueRegionCount() }}</span>
                  <span class="stat-label">Regiones</span>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- ── Filters ───────────────────────────────────────── -->
      <div class="filters">
        <!-- Sport chips -->
        @if (sportTypes().length > 0) {
          <div class="filters-sports" role="group" aria-label="Filtrar por deporte">
            <div class="chips-row">
              <button
                class="chip"
                [class.chip-active]="sportType() === ''"
                (click)="sportType.set('')"
                [attr.aria-pressed]="sportType() === ''"
              >
                <span class="chip-emoji" aria-hidden="true">🏆</span>
                Todos
              </button>
              @for (type of sportTypes(); track type) {
                <button
                  class="chip"
                  [class.chip-active]="sportType() === type"
                  (click)="sportType.set(type)"
                  [attr.aria-pressed]="sportType() === type"
                >
                  <span class="chip-emoji" aria-hidden="true">{{
                    sportEmoji(type)
                  }}</span>
                  {{ type }}
                </button>
              }
            </div>
          </div>
        }

        <!-- Location + date -->
        <div class="filters-row" role="search" aria-label="Filtros de ubicación y fecha">
          @if (countries().length > 0) {
            <div class="fgroup">
              <label class="flabel" for="country-select">País</label>
              <select
                id="country-select"
                class="fselect"
                [value]="country()"
                (change)="selectCountry($any($event.target).value)"
              >
                <option value="">Todos</option>
                @for (c of countries(); track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </div>
            <div class="fgroup">
              <label class="flabel" for="region-select">Región</label>
              <select
                id="region-select"
                class="fselect"
                [value]="region()"
                [disabled]="!country()"
                (change)="region.set($any($event.target).value)"
              >
                <option value="">Todas</option>
                @for (r of regions(); track r) {
                  <option [value]="r">{{ r }}</option>
                }
              </select>
            </div>
            <div class="fdivider" aria-hidden="true"></div>
          }

          <div class="fgroup">
            <label class="flabel" for="date-from">Desde</label>
            <input
              id="date-from"
              type="date"
              class="fdate"
              [value]="dateFrom()"
              (change)="dateFrom.set($any($event.target).value)"
            />
          </div>
          <div class="fgroup">
            <label class="flabel" for="date-to">Hasta</label>
            <input
              id="date-to"
              type="date"
              class="fdate"
              [value]="dateTo()"
              (change)="dateTo.set($any($event.target).value)"
            />
          </div>

          <div class="fspacer"></div>

          @if (hasActiveFilters()) {
            <button class="fclear" (click)="clearFilters()">
              ✕ Limpiar filtros
            </button>
          }
        </div>
      </div>

      <!-- ── Content ───────────────────────────────────────── -->
      <div class="content">
        @if (loadingEvents()) {
          <!-- Skeletons -->
          <div
            class="skeleton-grid"
            aria-busy="true"
            aria-label="Cargando eventos"
          >
            @for (i of skeletons; track i) {
              <div class="skeleton-card" aria-hidden="true">
                <div class="skeleton-banner"></div>
                <div class="skeleton-body">
                  <div
                    class="skeleton-line"
                    style="height: 22px; width: 75%"
                  ></div>
                  <div
                    class="skeleton-line"
                    style="height: 13px; width: 45%"
                  ></div>
                  <div
                    class="skeleton-line"
                    style="height: 13px; width: 85%"
                  ></div>
                  <div
                    class="skeleton-line"
                    style="height: 13px; width: 60%"
                  ></div>
                </div>
              </div>
            }
          </div>
        } @else if (events().length === 0) {
          <!-- Empty -->
          <div class="empty-state" role="status">
            <div class="empty-icon" aria-hidden="true">🔍</div>
            <p class="empty-title">Sin resultados</p>
            <p class="empty-text">
              @if (hasActiveFilters()) {
                No hay eventos que coincidan con los filtros seleccionados.
              } @else {
                Pronto aparecerán los próximos eventos deportivos.
              }
            </p>
            @if (hasActiveFilters()) {
              <button class="empty-clear" (click)="clearFilters()">
                Quitar filtros
              </button>
            }
          </div>
        } @else {
          <!-- Results -->
          <div class="content-header">
            <p class="results-label" role="status">
              <strong>{{ events().length }}</strong>
              evento{{ events().length === 1 ? '' : 's' }} encontrado{{
                events().length === 1 ? '' : 's'
              }}
              @if (hasActiveFilters()) {
                · con los filtros aplicados
              }
            </p>
          </div>

          <div class="events-grid">
            @for (event of events(); track event.id) {
              <article
                class="event-card"
                [class.event-card-featured]="event.featured"
                (click)="openEvent(event.id)"
                (keydown.enter)="openEvent(event.id)"
                (keydown.space)="openEvent(event.id)"
                tabindex="0"
                role="button"
                [attr.aria-label]="'Ver detalle de ' + event.name"
              >
                <!-- Banner -->
                <div class="card-banner">
                  @if (event.bannerUrl) {
                    <img
                      [src]="event.bannerUrl"
                      [alt]="event.name"
                      loading="lazy"
                    />
                  } @else {
                    <div
                      class="card-placeholder"
                      [style.background]="sportGradient(event.sportType)"
                      [attr.aria-label]="event.sportType"
                    >
                      <div class="placeholder-bg"></div>
                      <span class="placeholder-emoji" aria-hidden="true">{{
                        sportEmoji(event.sportType)
                      }}</span>
                    </div>
                  }

                  <div class="banner-overlay" aria-hidden="true"></div>

                  <div class="banner-badges" aria-hidden="true">
                    <span class="badge-sport">{{ event.sportType }}</span>
                    @if (event.featured) {
                      <span class="badge-featured">★ Destacado</span>
                    }
                  </div>

                  <div class="card-date-box" aria-hidden="true">
                    <span class="date-day">{{
                      event.eventDate | date: 'dd'
                    }}</span>
                    <span class="date-month">{{
                      event.eventDate | date: 'MMM' : '' : 'es'
                    }}</span>
                  </div>
                </div>

                <!-- Body -->
                <div class="card-body">
                  <h2 class="card-title">{{ event.name }}</h2>
                  <div class="card-location">
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                      />
                    </svg>
                    {{ event.city }}, {{ event.region }}
                  </div>
                  <p class="card-desc">{{ event.shortDescription }}</p>
                </div>

                <!-- Footer -->
                <div class="card-footer">
                  <span
                    class="status-badge"
                    [style.color]="statusColor(event.status)"
                  >
                    <span
                      class="status-dot"
                      [style.background]="statusColor(event.status)"
                    ></span>
                    {{ statusLabel(event.status) }}
                  </span>
                  <span class="card-cta" aria-hidden="true">Ver →</span>
                </div>
              </article>
            }
          </div>
        }
      </div>
    </main>
  `,
})
export class EventsPage {
  private readonly eventsService = inject(EventsService);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly sportType = signal('');
  readonly country = signal('');
  readonly region = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly loadingEvents = signal(true);
  readonly skeletons = [1, 2, 3, 4, 5, 6];

  private readonly initOptions = toSignal(
    this.isBrowser
      ? this.eventsService
          .getFilterOptions()
          .pipe(
            catchError(() => of({ sportTypes: [], countries: [], regions: [] })),
          )
      : of({ sportTypes: [], countries: [], regions: [] }),
    { initialValue: { sportTypes: [], countries: [], regions: [] } },
  );

  readonly sportTypes = computed(() => this.initOptions().sportTypes);
  readonly countries = computed(() => this.initOptions().countries);

  private readonly regionData = toSignal(
    this.isBrowser
      ? toObservable(this.country).pipe(
          distinctUntilChanged(),
          switchMap((c) =>
            c
              ? this.eventsService
                  .getFilterOptions(c)
                  .pipe(
                    catchError(() =>
                      of({ sportTypes: [], countries: [], regions: [] }),
                    ),
                  )
              : of({ sportTypes: [], countries: [], regions: [] }),
          ),
        )
      : of({ sportTypes: [], countries: [], regions: [] }),
    { initialValue: { sportTypes: [], countries: [], regions: [] } },
  );

  readonly regions = computed(() => this.regionData().regions);

  readonly hasActiveFilters = computed(
    () =>
      !!this.sportType() ||
      !!this.country() ||
      !!this.region() ||
      !!this.dateFrom() ||
      !!this.dateTo(),
  );

  private readonly activeFilters = computed(() => ({
    sportType: this.sportType() || undefined,
    country: this.country() || undefined,
    region: this.region() || undefined,
    dateFrom: this.dateFrom() || undefined,
    dateTo: this.dateTo() || undefined,
  }));

  readonly events = toSignal(
    this.isBrowser
      ? toObservable(this.activeFilters).pipe(
          debounceTime(300),
          tap(() => this.loadingEvents.set(true)),
          switchMap((f) =>
            this.eventsService
              .getEvents(f)
              .pipe(catchError(() => of([] as SportEvent[]))),
          ),
          tap(() => this.loadingEvents.set(false)),
        )
      : EMPTY,
    { initialValue: [] as SportEvent[] },
  );

  readonly uniqueSportCount = computed(
    () => new Set(this.events().map((e) => e.sportType)).size,
  );

  readonly uniqueRegionCount = computed(
    () => new Set(this.events().map((e) => e.region)).size,
  );

  selectCountry(c: string): void {
    this.country.set(c);
    this.region.set('');
  }

  openEvent(id: string): void {
    this.router.navigate(['/events', id]);
  }

  clearFilters(): void {
    this.sportType.set('');
    this.country.set('');
    this.region.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
  }

  sportEmoji(type: string): string {
    const map: Record<string, string> = {
      trail: '🏔️',
      running: '🏃',
      cycling: '🚴',
      triathlon: '🏊',
      swimming: '🏊',
      hiking: '🥾',
      mountain: '⛰️',
      atletismo: '🏟️',
      padel: '🎾',
      surf: '🏄',
    };
    return map[type?.toLowerCase()] ?? '🏆';
  }

  sportGradient(type: string): string {
    const map: Record<string, string> = {
      trail: 'linear-gradient(150deg, #0f1a0d 0%, #080d07 100%)',
      running: 'linear-gradient(150deg, #0d0f1a 0%, #070809 100%)',
      cycling: 'linear-gradient(150deg, #080f1a 0%, #050810 100%)',
      triathlon: 'linear-gradient(150deg, #071217 0%, #040b0f 100%)',
      hiking: 'linear-gradient(150deg, #1a100a 0%, #100906 100%)',
    };
    return map[type?.toLowerCase()] ?? 'linear-gradient(150deg, #121212 0%, #080808 100%)';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PUBLISHED: 'Próximamente',
      REGISTRATION_OPEN: 'Inscripciones abiertas',
      REGISTRATION_CLOSED: 'Inscripciones cerradas',
      IN_PROGRESS: 'En curso',
      FINISHED: 'Finalizado',
    };
    return map[status] ?? status;
  }

  statusColor(status: string): string {
    const map: Record<string, string> = {
      PUBLISHED: '#60a5fa',
      REGISTRATION_OPEN: '#4ade80',
      REGISTRATION_CLOSED: '#f87171',
      IN_PROGRESS: '#ff6500',
      FINISHED: '#6b7280',
    };
    return map[status] ?? '#6b7280';
  }
}
