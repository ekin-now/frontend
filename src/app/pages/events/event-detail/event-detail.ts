import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
import type { Map as LMap, Polyline, TileLayer } from 'leaflet';
import { MainHeader } from '../../../shared/main-header/main-header';
import { EventsService } from '../../../core/services/events.service';
import { SportSubEvent } from '../../../core/models/sport-event.model';

// ── Elevation chart helpers ───────────────────────────────────────────────────

function syntheticElevation(gainM: number, points = 120): number[] {
  const vals = Array.from({ length: points }, (_, i) => {
    const x = i / (points - 1);
    return (
      Math.sin(x * Math.PI) * 0.45 +
      Math.sin(x * Math.PI * 3) * 0.25 +
      Math.sin(x * Math.PI * 1.7 + 0.8) * 0.2 +
      Math.sin(x * Math.PI * 0.5) * 0.1
    );
  });
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  return vals.map((v) => ((v - min) / range) * gainM);
}

function buildSvgPath(
  elevations: number[],
  w: number,
  h: number,
  pad = 8,
): string {
  const maxE = Math.max(...elevations);
  const pts = elevations.map((e, i) => {
    const x = pad + (i / (elevations.length - 1)) * (w - pad * 2);
    const y = h - pad - (e / (maxE || 1)) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M ${pts.join(' L ')}`;
}

// ── GPX parser ────────────────────────────────────────────────────────────────

function parseGpxPoints(xml: string): [number, number][] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const trkpts = doc.querySelectorAll('trkpt');
  const result: [number, number][] = [];
  trkpts.forEach((pt) => {
    const lat = parseFloat(pt.getAttribute('lat') ?? '');
    const lon = parseFloat(pt.getAttribute('lon') ?? '');
    if (!isNaN(lat) && !isNaN(lon)) result.push([lat, lon]);
  });
  return result;
}

@Component({
  selector: 'app-event-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MainHeader, DatePipe, DecimalPipe],
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

      /* ─── Top bar ────────────────────────────────────────── */
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 2rem;
        border-bottom: 1px solid var(--ek-border);
        background: rgba(6, 6, 6, 0.9);
        backdrop-filter: blur(12px);
        position: sticky;
        top: 60px;
        z-index: 40;
        gap: 1rem;
      }

      .back-btn {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        background: none;
        border: 1px solid var(--ek-border);
        color: var(--ek-text-muted);
        font-family: var(--ek-font-body);
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        padding: 0.4rem 0.9rem;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.15s;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .back-btn:hover {
        border-color: var(--ek-accent);
        color: var(--ek-accent);
      }

      .topbar-title {
        font-family: var(--ek-font-display);
        font-size: 1rem;
        letter-spacing: 0.08em;
        color: var(--ek-text);
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .topbar-actions {
        display: flex;
        gap: 0.5rem;
        flex-shrink: 0;
      }

      .icon-btn {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        background: var(--ek-surface-2);
        border: 1px solid var(--ek-border);
        color: var(--ek-text-muted);
        font-family: var(--ek-font-body);
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.15s;
        white-space: nowrap;
      }

      .icon-btn:hover {
        border-color: var(--ek-accent);
        color: var(--ek-accent);
      }

      /* ─── Banner ─────────────────────────────────────────── */
      .banner {
        position: relative;
        aspect-ratio: 21 / 6;
        overflow: hidden;
        background: var(--ek-surface-2);
        min-height: 180px;
      }

      .banner-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .banner-fallback {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 5rem;
        opacity: 0.15;
      }

      .banner-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          to bottom,
          rgba(6, 6, 6, 0.2) 0%,
          rgba(6, 6, 6, 0.85) 100%
        );
      }

      .banner-content {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: flex-end;
        padding: 1.5rem 2rem;
      }

      .banner-inner {
        display: flex;
        align-items: flex-end;
        gap: 1.25rem;
        max-width: 1280px;
        width: 100%;
      }

      .event-logo {
        width: 64px;
        height: 64px;
        border-radius: 8px;
        object-fit: cover;
        border: 2px solid rgba(255, 255, 255, 0.15);
        flex-shrink: 0;
        background: var(--ek-surface-2);
      }

      .event-logo-placeholder {
        width: 64px;
        height: 64px;
        border-radius: 8px;
        border: 2px solid rgba(255, 255, 255, 0.1);
        background: var(--ek-surface-2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.6rem;
        flex-shrink: 0;
      }

      .banner-meta {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .event-sport-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        background: var(--ek-accent);
        color: #fff;
        font-size: 0.6rem;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        padding: 0.2rem 0.6rem;
        border-radius: 3px;
        width: fit-content;
      }

      .event-name {
        font-family: var(--ek-font-display);
        font-size: clamp(1.8rem, 4vw, 3rem);
        letter-spacing: 0.04em;
        color: #fff;
        line-height: 1;
      }

      .event-meta-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.78rem;
        color: rgba(245, 245, 240, 0.7);
      }

      .meta-item svg {
        opacity: 0.7;
        flex-shrink: 0;
      }

      /* ─── Sub-event tabs ─────────────────────────────────── */
      .sub-tabs {
        background: var(--ek-surface);
        border-bottom: 1px solid var(--ek-border);
        overflow-x: auto;
        scrollbar-width: none;
      }

      .sub-tabs::-webkit-scrollbar {
        display: none;
      }

      .sub-tabs-inner {
        display: flex;
        width: max-content;
        padding: 0 2rem;
      }

      .sub-tab {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 0.75rem 1.25rem;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        background: none;
        border-top: none;
        border-left: none;
        border-right: none;
        transition: all 0.15s;
        text-align: left;
        white-space: nowrap;
      }

      .sub-tab:hover .tab-name {
        color: var(--ek-text);
      }

      .sub-tab-active {
        border-bottom-color: var(--ek-accent);
      }

      .sub-tab-active .tab-name {
        color: var(--ek-accent);
      }

      .tab-name {
        font-family: var(--ek-font-display);
        font-size: 0.95rem;
        letter-spacing: 0.06em;
        color: var(--ek-text-muted);
        transition: color 0.15s;
      }

      .tab-dist {
        font-size: 0.65rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        color: var(--ek-text-dim);
        text-transform: uppercase;
        margin-top: 0.1rem;
      }

      /* ─── Main grid ──────────────────────────────────────── */
      .main-grid {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 0;
        max-width: 1280px;
        margin: 0 auto;
        padding: 1.5rem 2rem;
        align-items: start;
      }

      /* ─── Map ────────────────────────────────────────────── */
      .map-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding-right: 1.5rem;
      }

      .map-wrap {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--ek-border);
        background: var(--ek-surface-2);
        height: 380px;
      }

      #ek-map {
        width: 100%;
        height: 100%;
      }

      .map-loading {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--ek-surface-2);
        color: var(--ek-text-muted);
        font-size: 0.8rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        gap: 0.5rem;
        flex-direction: column;
      }

      .map-spinner {
        width: 28px;
        height: 28px;
        border: 2px solid var(--ek-border);
        border-top-color: var(--ek-accent);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* ─── Elevation chart ────────────────────────────────── */
      .elevation-section {
        border: 1px solid var(--ek-border);
        border-radius: 8px;
        overflow: hidden;
        background: var(--ek-surface);
      }

      .elevation-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--ek-border);
      }

      .elevation-title {
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--ek-text-muted);
      }

      .elevation-stat {
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--ek-accent);
        letter-spacing: 0.04em;
      }

      .elevation-svg-wrap {
        padding: 0.5rem;
      }

      .elevation-svg {
        width: 100%;
        height: 80px;
        display: block;
      }

      .elev-area {
        fill: url(#elevGrad);
      }

      .elev-line {
        fill: none;
        stroke: var(--ek-accent);
        stroke-width: 1.5;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .elevation-axis {
        display: flex;
        justify-content: space-between;
        padding: 0 1rem 0.5rem;
      }

      .axis-label {
        font-size: 0.6rem;
        color: var(--ek-text-dim);
        font-weight: 600;
        letter-spacing: 0.06em;
      }

      /* ─── Info panel ─────────────────────────────────────── */
      .info-panel {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        position: sticky;
        top: 120px;
      }

      .panel-card {
        background: var(--ek-surface);
        border: 1px solid var(--ek-border);
        border-radius: 8px;
        overflow: hidden;
      }

      .panel-section {
        padding: 1rem;
        border-bottom: 1px solid var(--ek-border);
      }

      .panel-section:last-child {
        border-bottom: none;
      }

      .panel-section-label {
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--ek-text-dim);
        margin-bottom: 0.75rem;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }

      .stat-box {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }

      .stat-value {
        font-family: var(--ek-font-display);
        font-size: 1.4rem;
        letter-spacing: 0.04em;
        color: var(--ek-text);
        line-height: 1;
      }

      .stat-unit {
        font-size: 0.65rem;
        color: var(--ek-text-muted);
        letter-spacing: 0.06em;
      }

      .stat-key {
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--ek-text-dim);
      }

      /* Registration */
      .capacity-row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 0.5rem;
      }

      .capacity-count {
        font-family: var(--ek-font-display);
        font-size: 1.6rem;
        letter-spacing: 0.04em;
        color: var(--ek-text);
        line-height: 1;
      }

      .capacity-total {
        font-size: 0.78rem;
        color: var(--ek-text-muted);
      }

      .capacity-pct {
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: var(--ek-accent);
      }

      .progress-bar {
        height: 6px;
        background: var(--ek-surface-3);
        border-radius: 100px;
        overflow: hidden;
        margin-bottom: 0.4rem;
      }

      .progress-fill {
        height: 100%;
        border-radius: 100px;
        background: linear-gradient(90deg, var(--ek-accent) 0%, #ff9a00 100%);
        transition: width 0.6s ease;
      }

      .progress-fill-warning {
        background: linear-gradient(90deg, #f87171 0%, #fca5a5 100%);
      }

      .capacity-label {
        font-size: 0.6rem;
        color: var(--ek-text-dim);
        letter-spacing: 0.06em;
      }

      /* Price */
      .price-row {
        display: flex;
        align-items: baseline;
        gap: 0.4rem;
        margin-bottom: 1rem;
      }

      .price-value {
        font-family: var(--ek-font-display);
        font-size: 2rem;
        letter-spacing: 0.04em;
        color: var(--ek-text);
        line-height: 1;
      }

      .price-currency {
        font-size: 0.85rem;
        color: var(--ek-text-muted);
        font-weight: 600;
      }

      .price-note {
        font-size: 0.65rem;
        color: var(--ek-text-dim);
        letter-spacing: 0.04em;
      }

      /* CTA button */
      .cta-btn {
        width: 100%;
        background: var(--ek-accent);
        border: none;
        color: #fff;
        font-family: var(--ek-font-display);
        font-size: 1.1rem;
        letter-spacing: 0.1em;
        padding: 0.85rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.15s, transform 0.1s;
        text-transform: uppercase;
      }

      .cta-btn:hover {
        background: var(--ek-accent-hover);
        transform: translateY(-1px);
      }

      .cta-btn:active {
        transform: translateY(0);
      }

      .cta-btn:disabled {
        background: var(--ek-surface-3);
        color: var(--ek-text-dim);
        cursor: not-allowed;
        transform: none;
      }

      .cta-closed {
        text-align: center;
        font-size: 0.75rem;
        color: var(--ek-text-dim);
        letter-spacing: 0.06em;
        padding-top: 0.5rem;
      }

      /* Status badge */
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 0.2rem 0.6rem;
        border-radius: 100px;
        background: var(--ek-surface-3);
      }

      .status-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      /* Requirements row */
      .reqs-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-top: 0.5rem;
      }

      .req-chip {
        background: var(--ek-surface-2);
        border: 1px solid var(--ek-border);
        color: var(--ek-text-muted);
        font-size: 0.65rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        padding: 0.2rem 0.55rem;
        border-radius: 3px;
        text-transform: uppercase;
      }

      /* ─── Bottom section ─────────────────────────────────── */
      .bottom-section {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 2rem 3rem;
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 1.5rem;
        align-items: start;
      }

      .desc-card {
        background: var(--ek-surface);
        border: 1px solid var(--ek-border);
        border-radius: 8px;
        padding: 1.5rem;
      }

      .desc-title {
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--ek-text-dim);
        margin-bottom: 1rem;
      }

      .desc-text {
        font-size: 0.875rem;
        line-height: 1.7;
        color: var(--ek-text-muted);
        white-space: pre-wrap;
      }

      .company-card {
        background: var(--ek-surface);
        border: 1px solid var(--ek-border);
        border-radius: 8px;
        overflow: hidden;
      }

      .company-banner {
        height: 80px;
        background: var(--ek-surface-2);
        position: relative;
        overflow: hidden;
      }

      .company-banner img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .company-body {
        padding: 1rem;
      }

      .company-identity {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: -2rem;
        margin-bottom: 0.75rem;
      }

      .company-logo {
        width: 48px;
        height: 48px;
        border-radius: 6px;
        object-fit: cover;
        border: 2px solid var(--ek-border);
        background: var(--ek-surface-2);
        flex-shrink: 0;
      }

      .company-logo-placeholder {
        width: 48px;
        height: 48px;
        border-radius: 6px;
        border: 2px solid var(--ek-border);
        background: var(--ek-surface-2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        flex-shrink: 0;
      }

      .company-name {
        font-family: var(--ek-font-display);
        font-size: 1rem;
        letter-spacing: 0.04em;
        color: var(--ek-text);
        padding-top: 1.5rem;
      }

      .company-type {
        font-size: 0.65rem;
        font-weight: 600;
        color: var(--ek-text-dim);
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .company-desc {
        font-size: 0.8rem;
        color: var(--ek-text-muted);
        line-height: 1.6;
        margin-bottom: 0.75rem;
      }

      .company-link {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        color: var(--ek-accent);
        text-decoration: none;
        text-transform: uppercase;
        transition: opacity 0.15s;
      }

      .company-link:hover {
        opacity: 0.8;
      }

      /* ─── States ─────────────────────────────────────────── */
      .loading-page {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        flex-direction: column;
        gap: 1rem;
        color: var(--ek-text-muted);
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .error-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        gap: 0.75rem;
        text-align: center;
        padding: 2rem;
      }

      .error-icon {
        font-size: 3rem;
        opacity: 0.4;
      }

      .error-title {
        font-family: var(--ek-font-display);
        font-size: 1.5rem;
        letter-spacing: 0.04em;
        color: var(--ek-text);
      }

      .error-text {
        font-size: 0.85rem;
        color: var(--ek-text-muted);
      }

      .error-btn {
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

      .error-btn:hover {
        background: var(--ek-accent);
        color: #fff;
      }

      /* ─── Responsive ─────────────────────────────────────── */
      @media (max-width: 900px) {
        .main-grid,
        .bottom-section {
          grid-template-columns: 1fr;
          padding: 1rem;
        }

        .map-section {
          padding-right: 0;
        }

        .info-panel {
          position: static;
        }

        .topbar {
          padding: 0.6rem 1rem;
        }

        .banner-content {
          padding: 1rem;
        }

        .event-name {
          font-size: 1.6rem;
        }
      }
    `,
  ],
  template: `
    <app-main-header />

    <main class="page">
      @if (loading()) {
        <div class="loading-page" role="status" aria-live="polite">
          <div class="map-spinner" aria-hidden="true"></div>
          Cargando evento...
        </div>
      } @else if (error() || !event()) {
        <div class="error-page">
          <div class="error-icon" aria-hidden="true">🏔️</div>
          <p class="error-title">Evento no encontrado</p>
          <p class="error-text">No pudimos cargar la información de este evento.</p>
          <button class="error-btn" (click)="back()">← Volver a eventos</button>
        </div>
      } @else {
        <!-- ── Top bar ──────────────────────────────────────── -->
        <div class="topbar">
          <button class="back-btn" (click)="back()" aria-label="Volver a eventos">
            ← Volver
          </button>
          <span class="topbar-title" aria-hidden="true">{{ event()!.name }}</span>
          <div class="topbar-actions">
            <button class="icon-btn" (click)="share()" aria-label="Compartir evento">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/>
              </svg>
              Compartir
            </button>
          </div>
        </div>

        <!-- ── Banner ──────────────────────────────────────── -->
        <div class="banner" role="img" [attr.aria-label]="event()!.name">
          @if (event()!.bannerUrl) {
            <img class="banner-img" [src]="event()!.bannerUrl!" [alt]="event()!.name" />
          } @else {
            <div class="banner-fallback" aria-hidden="true">{{ sportEmoji(event()!.sportType) }}</div>
          }
          <div class="banner-overlay" aria-hidden="true"></div>
          <div class="banner-content">
            <div class="banner-inner">
              @if (event()!.logoUrl) {
                <img class="event-logo" [src]="event()!.logoUrl!" [alt]="event()!.name + ' logo'" />
              } @else {
                <div class="event-logo-placeholder" aria-hidden="true">{{ sportEmoji(event()!.sportType) }}</div>
              }
              <div class="banner-meta">
                <span class="event-sport-badge">{{ event()!.sportType }}</span>
                <h1 class="event-name">{{ event()!.name }}</h1>
                <div class="event-meta-row">
                  <span class="meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    {{ event()!.city }}, {{ event()!.region }}
                  </span>
                  <span class="meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                    </svg>
                    {{ event()!.eventDate | date:'d MMM yyyy':'':'es' }}
                  </span>
                  @if (event()!.address) {
                    <span class="meta-item">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                      </svg>
                      {{ event()!.address }}
                    </span>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Sub-event tabs ──────────────────────────────── -->
        @if (event()!.subEvents?.length) {
          <div class="sub-tabs" role="tablist" aria-label="Modalidades del evento">
            <div class="sub-tabs-inner">
              @for (sub of event()!.subEvents; track sub.id) {
                <button
                  class="sub-tab"
                  [class.sub-tab-active]="selectedSub()?.id === sub.id"
                  (click)="selectedSub.set(sub)"
                  role="tab"
                  [attr.aria-selected]="selectedSub()?.id === sub.id"
                  [attr.aria-controls]="'panel-' + sub.id"
                >
                  <span class="tab-name">{{ sub.name }}</span>
                  @if (sub.distanceKm) {
                    <span class="tab-dist">{{ sub.distanceKm | number:'1.0-1' }} km</span>
                  }
                </button>
              }
            </div>
          </div>
        }

        <!-- ── Main grid ───────────────────────────────────── -->
        @if (selectedSub(); as sub) {
          <div class="main-grid" [id]="'panel-' + sub.id" role="tabpanel">
            <!-- Map + elevation -->
            <section class="map-section" aria-label="Mapa del recorrido">
              <div class="map-wrap">
                <div #mapContainer id="ek-map" aria-label="Mapa interactivo del recorrido"></div>
                @if (loadingGpx()) {
                  <div class="map-loading" aria-live="polite">
                    <div class="map-spinner" aria-hidden="true"></div>
                    Cargando recorrido...
                  </div>
                }
              </div>

              <!-- Elevation chart -->
              @if (sub.elevationGainMeters) {
                <div class="elevation-section" aria-label="Perfil de altimetría">
                  <div class="elevation-header">
                    <span class="elevation-title">Perfil altimétrico</span>
                    <span class="elevation-stat">+{{ sub.elevationGainMeters | number }} m D+</span>
                  </div>
                  <div class="elevation-svg-wrap">
                    <svg
                      class="elevation-svg"
                      [attr.viewBox]="'0 0 ' + SVG_W + ' ' + SVG_H"
                      preserveAspectRatio="none"
                      role="img"
                      [attr.aria-label]="'Perfil de elevación: ' + sub.elevationGainMeters + ' metros de desnivel'"
                    >
                      <defs>
                        <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stop-color="#ff6500" stop-opacity="0.35" />
                          <stop offset="100%" stop-color="#ff6500" stop-opacity="0.02" />
                        </linearGradient>
                      </defs>
                      <path
                        class="elev-area"
                        [attr.d]="elevAreaPath(sub)"
                      />
                      <path
                        class="elev-line"
                        [attr.d]="elevLinePath(sub)"
                      />
                    </svg>
                  </div>
                  <div class="elevation-axis" aria-hidden="true">
                    <span class="axis-label">0 km</span>
                    @if (sub.distanceKm) {
                      <span class="axis-label">{{ sub.distanceKm / 2 | number:'1.0-0' }} km</span>
                      <span class="axis-label">{{ sub.distanceKm | number:'1.0-0' }} km</span>
                    }
                  </div>
                </div>
              }
            </section>

            <!-- Info panel -->
            <aside class="info-panel" aria-label="Información y inscripción">
              <div class="panel-card">
                <!-- Status + dates -->
                <div class="panel-section">
                  <p class="panel-section-label">Estado</p>
                  <span
                    class="status-pill"
                    [style.color]="statusColor(sub.status)"
                  >
                    <span class="status-dot" [style.background]="statusColor(sub.status)"></span>
                    {{ statusLabel(sub.status) }}
                  </span>
                  @if (sub.startDateTime) {
                    <div style="margin-top: 0.6rem; font-size: 0.78rem; color: var(--ek-text-muted)">
                      Salida: <strong style="color: var(--ek-text)">{{ sub.startDateTime | date:'d MMM yyyy, HH:mm':'':'es' }}</strong>
                    </div>
                  }
                </div>

                <!-- Race stats -->
                <div class="panel-section">
                  <p class="panel-section-label">Datos del recorrido</p>
                  <div class="stats-grid">
                    @if (sub.distanceKm) {
                      <div class="stat-box">
                        <span class="stat-value">{{ sub.distanceKm | number:'1.0-1' }}</span>
                        <span class="stat-unit">km</span>
                        <span class="stat-key">Distancia</span>
                      </div>
                    }
                    @if (sub.elevationGainMeters) {
                      <div class="stat-box">
                        <span class="stat-value">{{ sub.elevationGainMeters | number }}</span>
                        <span class="stat-unit">m D+</span>
                        <span class="stat-key">Desnivel</span>
                      </div>
                    }
                    @if (sub.timeLimitMinutes) {
                      <div class="stat-box">
                        <span class="stat-value">{{ sub.timeLimitMinutes / 60 | number:'1.0-0' }}</span>
                        <span class="stat-unit">horas</span>
                        <span class="stat-key">Tiempo límite</span>
                      </div>
                    }
                    @if (sub.minimumAge) {
                      <div class="stat-box">
                        <span class="stat-value">{{ sub.minimumAge }}</span>
                        <span class="stat-unit">años</span>
                        <span class="stat-key">Edad mínima</span>
                      </div>
                    }
                  </div>

                  @if (sub.bibNumberRequired) {
                    <div class="reqs-row" aria-label="Requisitos">
                      <span class="req-chip" title="Dorsal obligatorio">Dorsal obligatorio</span>
                      @if (sub.bibStartNumber && sub.bibEndNumber) {
                        <span class="req-chip">Nº {{ sub.bibStartNumber }}–{{ sub.bibEndNumber }}</span>
                      }
                    </div>
                  }
                </div>

                <!-- Capacity -->
                <div class="panel-section">
                  <p class="panel-section-label">Plazas</p>
                  <div class="capacity-row">
                    <div>
                      <span class="capacity-count">{{ sub.registeredParticipants }}</span>
                      <span class="capacity-total"> / {{ sub.capacity }}</span>
                    </div>
                    <span class="capacity-pct">{{ fillPct(sub) }}%</span>
                  </div>
                  <div class="progress-bar" role="progressbar"
                    [attr.aria-valuenow]="sub.registeredParticipants"
                    [attr.aria-valuemin]="0"
                    [attr.aria-valuemax]="sub.capacity"
                    [attr.aria-label]="sub.registeredParticipants + ' de ' + sub.capacity + ' plazas ocupadas'"
                  >
                    <div
                      class="progress-fill"
                      [class.progress-fill-warning]="fillPct(sub) >= 90"
                      [style.width]="fillPct(sub) + '%'"
                    ></div>
                  </div>
                  <p class="capacity-label">
                    @if (sub.capacity - sub.registeredParticipants <= 0) {
                      Sin plazas disponibles
                    } @else if (fillPct(sub) >= 90) {
                      ¡Solo quedan {{ sub.capacity - sub.registeredParticipants }} plazas!
                    } @else {
                      {{ sub.capacity - sub.registeredParticipants }} plazas disponibles
                    }
                  </p>
                </div>

                <!-- Price + CTA -->
                <div class="panel-section">
                  <div class="price-row">
                    <span class="price-value">{{ sub.price | number:'1.0-2' }}</span>
                    <span class="price-currency">{{ sub.currency }}</span>
                  </div>
                  <p class="price-note">Precio por participante · IVA incluido</p>

                  <div style="margin-top: 1rem">
                    @if (canRegister(sub)) {
                      <button
                        class="cta-btn"
                        (click)="register(sub)"
                        [disabled]="sub.registeredParticipants >= sub.capacity"
                      >
                        Inscribirme
                      </button>
                    } @else {
                      <button class="cta-btn" disabled>
                        {{ registrationClosedLabel(sub) }}
                      </button>
                      <p class="cta-closed">{{ registrationClosedReason(sub) }}</p>
                    }
                  </div>
                </div>
              </div>

              <!-- Website link -->
              @if (event()!.websiteUrl) {
                <a
                  [href]="event()!.websiteUrl!"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="icon-btn"
                  style="justify-content: center; text-decoration: none"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  Web oficial
                </a>
              }
            </aside>
          </div>
        }

        <!-- ── Bottom: description + company ──────────────── -->
        <div class="bottom-section">
          <div class="desc-card">
            <p class="desc-title">Sobre el evento</p>
            <p class="desc-text">{{ event()!.description }}</p>
          </div>

          @if (event()!.company; as co) {
            <div class="company-card" aria-label="Organizador">
              <div class="company-banner">
                @if (co.bannerUrl) {
                  <img [src]="co.bannerUrl" [alt]="co.name + ' banner'" style="width:100%;height:100%;object-fit:cover" />
                }
              </div>
              <div class="company-body">
                <div class="company-identity">
                  @if (co.logoUrl) {
                    <img class="company-logo" [src]="co.logoUrl" [alt]="co.name + ' logo'" />
                  } @else {
                    <div class="company-logo-placeholder" aria-hidden="true">🏢</div>
                  }
                  <div>
                    <div class="company-name">{{ co.name }}</div>
                    @if (co.companyType) {
                      <div class="company-type">{{ co.companyType }}</div>
                    }
                  </div>
                </div>

                @if (co.description) {
                  <p class="company-desc">{{ co.description }}</p>
                }

                @if (co.website) {
                  <a
                    [href]="co.website"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="company-link"
                    [attr.aria-label]="'Visitar web de ' + co.name"
                  >
                    Visitar web →
                  </a>
                }
              </div>
            </div>
          }
        </div>
      }
    </main>
  `,
})
export class EventDetailPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventsService = inject(EventsService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly SVG_W = 600;
  readonly SVG_H = 80;

  readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly loadingGpx = signal(false);
  readonly selectedSub = signal<SportSubEvent | null>(null);
  readonly shareSuccess = signal(false);

  private leafletMap: LMap | null = null;
  private gpxLayer: Polyline | null = null;
  private tileLayer: TileLayer | null = null;
  private L: typeof import('leaflet') | null = null;

  private readonly rawEvent = toSignal(
    this.route.paramMap.pipe(
      map((p) => p.get('id') ?? ''),
      switchMap((id) =>
        this.eventsService.getEventDetail(id).pipe(
          catchError(() => {
            this.error.set(true);
            return of(null);
          }),
        ),
      ),
    ),
  );

  readonly event = computed(() => this.rawEvent() ?? null);

  constructor() {
    // Side effects on data load: update loading flag + auto-select first sub-event
    effect(() => {
      const e = this.rawEvent();
      if (e === undefined) return;
      this.loading.set(false);
      if (e && !this.selectedSub() && e.subEvents?.length) {
        this.selectedSub.set(e.subEvents[0]);
      }
    });

    if (this.isBrowser) {
      afterNextRender(() => {
        this.initMap();
      });

      // Reload GPX when sub-event changes
      effect(() => {
        const sub = this.selectedSub();
        if (sub) this.loadGpx(sub);
      });
    }
  }

  ngOnDestroy(): void {
    this.leafletMap?.remove();
    this.leafletMap = null;
  }

  // ── Map ───────────────────────────────────────────────────────────────────

  private async initMap(): Promise<void> {
    const container = this.mapContainer()?.nativeElement;
    if (!container || this.leafletMap) return;

    this.L = await import('leaflet');
    const L = this.L;

    // Fix default icon paths broken by bundlers
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)['_getIconUrl'];
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const ev = this.event();
    const lat = ev?.latitude ?? 40.416;
    const lon = ev?.longitude ?? -3.703;

    this.leafletMap = L.map(container, { zoomControl: true }).setView([lat, lon], 12);

    this.tileLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      },
    ).addTo(this.leafletMap);

    // Add event marker if no GPX yet
    if (ev?.latitude && ev?.longitude) {
      L.marker([ev.latitude, ev.longitude]).addTo(this.leafletMap);
    }

    // Load initial sub-event GPX
    const sub = this.selectedSub();
    if (sub) this.loadGpx(sub);
  }

  private async loadGpx(sub: SportSubEvent): Promise<void> {
    if (!this.isBrowser || !this.leafletMap || !this.L) return;
    const L = this.L;

    // Remove previous GPX layer
    if (this.gpxLayer) {
      this.leafletMap.removeLayer(this.gpxLayer);
      this.gpxLayer = null;
    }

    if (!sub.gpxUrl) {
      // Fall back to event center marker
      const ev = this.event();
      if (ev?.latitude && ev?.longitude) {
        this.leafletMap.setView([ev.latitude, ev.longitude], 12);
      }
      return;
    }

    this.loadingGpx.set(true);

    try {
      const res = await fetch(sub.gpxUrl);
      if (!res.ok) throw new Error('GPX fetch failed');
      const xml = await res.text();
      const points = parseGpxPoints(xml);

      if (points.length > 1) {
        this.gpxLayer = L.polyline(points, {
          color: '#ff6500',
          weight: 3,
          opacity: 0.9,
        }).addTo(this.leafletMap);

        this.leafletMap.fitBounds(this.gpxLayer.getBounds(), { padding: [24, 24] });

        // Start marker
        L.circleMarker(points[0], {
          radius: 7,
          fillColor: '#4ade80',
          color: '#fff',
          weight: 2,
          fillOpacity: 1,
        }).addTo(this.leafletMap);

        // End marker
        L.circleMarker(points[points.length - 1], {
          radius: 7,
          fillColor: '#f87171',
          color: '#fff',
          weight: 2,
          fillOpacity: 1,
        }).addTo(this.leafletMap);
      }
    } catch {
      // Silently fall back to event coordinates
    } finally {
      this.loadingGpx.set(false);
    }
  }

  // ── Elevation SVG ─────────────────────────────────────────────────────────

  private elevCache = new Map<string, number[]>();

  private getElevations(sub: SportSubEvent): number[] {
    const key = sub.id;
    if (!this.elevCache.has(key)) {
      this.elevCache.set(key, syntheticElevation(sub.elevationGainMeters ?? 500));
    }
    return this.elevCache.get(key)!;
  }

  elevLinePath(sub: SportSubEvent): string {
    return buildSvgPath(this.getElevations(sub), this.SVG_W, this.SVG_H);
  }

  elevAreaPath(sub: SportSubEvent): string {
    const line = buildSvgPath(this.getElevations(sub), this.SVG_W, this.SVG_H);
    const pad = 8;
    return `${line} L ${this.SVG_W - pad},${this.SVG_H - pad} L ${pad},${this.SVG_H - pad} Z`;
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  back(): void {
    this.router.navigate(['/events']);
  }

  async share(): Promise<void> {
    const ev = this.event();
    if (!ev) return;
    const shareData = {
      title: ev.name,
      text: ev.shortDescription,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        // Brief visual feedback handled by button
      }
    } catch {
      // User cancelled or API unavailable
    }
  }

  register(sub: SportSubEvent): void {
    // Registration flow placeholder
    alert(`Inscripción a "${sub.name}" — próximamente disponible.`);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  fillPct(sub: SportSubEvent): number {
    if (!sub.capacity) return 0;
    return Math.min(100, Math.round((sub.registeredParticipants / sub.capacity) * 100));
  }

  canRegister(sub: SportSubEvent): boolean {
    return sub.status === 'REGISTRATION_OPEN' && sub.registeredParticipants < sub.capacity;
  }

  registrationClosedLabel(sub: SportSubEvent): string {
    if (sub.registeredParticipants >= sub.capacity) return 'Sin plazas';
    if (sub.status === 'REGISTRATION_CLOSED') return 'Inscripciones cerradas';
    if (sub.status === 'DRAFT') return 'Próximamente';
    return 'No disponible';
  }

  registrationClosedReason(sub: SportSubEvent): string {
    if (sub.registeredParticipants >= sub.capacity) return 'Aforo completo';
    if (sub.registrationOpenAt) {
      const d = new Date(sub.registrationOpenAt);
      return `Apertura: ${d.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }
    return '';
  }

  sportEmoji(type: string): string {
    const map: Record<string, string> = {
      trail: '🏔️',
      running: '🏃',
      cycling: '🚴',
      triathlon: '🏊',
      swimming: '🏊',
      hiking: '🥾',
    };
    return map[type?.toLowerCase()] ?? '🏆';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PUBLISHED: 'Próximamente',
      REGISTRATION_OPEN: 'Inscripciones abiertas',
      REGISTRATION_CLOSED: 'Inscripciones cerradas',
      IN_PROGRESS: 'En curso',
      FINISHED: 'Finalizado',
      DRAFT: 'Borrador',
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
      DRAFT: '#6b7280',
    };
    return map[status] ?? '#6b7280';
  }
}
