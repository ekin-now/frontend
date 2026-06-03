import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  catchError,
  of
} from 'rxjs';
import { MainHeader } from '../../shared/main-header/main-header';
import { PostService } from '../../core/services/post.service';
import { Post, PostComment, ActivityData } from '../../core/models/post.model';

@Component({
  selector: 'app-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MainHeader, DatePipe, DecimalPipe, FormsModule],
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

      /* ─── Layout ──────────────────────────────────────────── */
      .layout {
        max-width: 680px;
        margin: 0 auto;
        padding: 2rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      /* ─── Compose box ──────────────────────────────────────── */
      .compose {
        background: var(--ek-surface);
        border: 1px solid var(--ek-border);
        border-radius: 10px;
        overflow: hidden;
      }

      .compose-header {
        display: flex;
        align-items: flex-start;
        gap: 0.85rem;
        padding: 1rem 1.1rem 0.6rem;
      }

      .compose-avatar {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: var(--ek-surface-2);
        border: 1px solid var(--ek-border);
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        color: var(--ek-text-muted);
        overflow: hidden;
      }

      .compose-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .compose-textarea {
        flex: 1;
        background: none;
        border: none;
        outline: none;
        color: var(--ek-text);
        font-family: var(--ek-font-body);
        font-size: 0.9rem;
        line-height: 1.55;
        resize: none;
        width: 100%;
        min-height: 56px;
        padding-top: 0.15rem;
      }

      .compose-textarea::placeholder {
        color: var(--ek-text-dim);
      }

      /* Type pills */
      .compose-types {
        display: flex;
        gap: 0.4rem;
        padding: 0 1.1rem 0.75rem 4.55rem;
        overflow-x: auto;
        scrollbar-width: none;
      }

      .compose-types::-webkit-scrollbar {
        display: none;
      }

      .type-pill {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        background: var(--ek-surface-2);
        border: 1px solid var(--ek-border);
        color: var(--ek-text-muted);
        font-family: var(--ek-font-body);
        font-size: 0.68rem;
        font-weight: 600;
        padding: 0.25rem 0.65rem;
        border-radius: 100px;
        cursor: pointer;
        transition: all 0.15s;
        letter-spacing: 0.04em;
        white-space: nowrap;
      }

      .type-pill:hover {
        border-color: rgba(255, 101, 0, 0.4);
        color: var(--ek-text);
      }

      .type-pill-active {
        background: rgba(255, 101, 0, 0.12);
        border-color: var(--ek-accent);
        color: var(--ek-accent);
      }

      /* Activity fields */
      .compose-activity {
        padding: 0 1.1rem 0.75rem 4.55rem;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 0.5rem;
      }

      .activity-field {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }

      .activity-label {
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--ek-text-dim);
      }

      .activity-input {
        background: var(--ek-surface-2);
        border: 1px solid var(--ek-border);
        color: var(--ek-text);
        font-family: var(--ek-font-body);
        font-size: 0.8rem;
        padding: 0.3rem 0.5rem;
        border-radius: 4px;
        outline: none;
        transition: border-color 0.15s;
        width: 100%;
      }

      .activity-input:focus {
        border-color: var(--ek-accent);
      }

      /* Image URL field */
      .compose-image-row {
        padding: 0 1.1rem 0.75rem 4.55rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .compose-image-input {
        flex: 1;
        background: var(--ek-surface-2);
        border: 1px solid var(--ek-border);
        color: var(--ek-text);
        font-family: var(--ek-font-body);
        font-size: 0.78rem;
        padding: 0.3rem 0.6rem;
        border-radius: 4px;
        outline: none;
        transition: border-color 0.15s;
      }

      .compose-image-input::placeholder {
        color: var(--ek-text-dim);
      }

      .compose-image-input:focus {
        border-color: var(--ek-accent);
      }

      /* Footer */
      .compose-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 0.65rem 1.1rem;
        border-top: 1px solid var(--ek-border);
      }

      .char-count {
        font-size: 0.7rem;
        color: var(--ek-text-dim);
      }

      .char-count-warn {
        color: #f87171;
      }

      .btn-post {
        background: var(--ek-accent);
        border: none;
        color: #fff;
        font-family: var(--ek-font-body);
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        padding: 0.4rem 1.2rem;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.15s;
      }

      .btn-post:hover:not(:disabled) {
        background: var(--ek-accent-hover);
      }

      .btn-post:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      /* ─── Post card ───────────────────────────────────────── */
      .post-card {
        background: var(--ek-surface);
        border: 1px solid var(--ek-border);
        border-radius: 10px;
        overflow: hidden;
      }

      /* Post header */
      .post-header {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 1rem 1.1rem 0.6rem;
      }

      .post-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--ek-surface-2);
        border: 1px solid var(--ek-border);
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        color: var(--ek-text-muted);
        overflow: hidden;
      }

      .post-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .post-meta {
        flex: 1;
        min-width: 0;
      }

      .post-author {
        font-size: 0.875rem;
        font-weight: 700;
        color: var(--ek-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .post-time {
        font-size: 0.72rem;
        color: var(--ek-text-dim);
      }

      .post-type-badge {
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        padding: 0.15rem 0.5rem;
        border-radius: 3px;
        border: 1px solid;
        flex-shrink: 0;
        align-self: flex-start;
        margin-top: 0.1rem;
      }

      /* Post body */
      .post-text {
        padding: 0 1.1rem 0.75rem 5.5rem;
        font-size: 0.88rem;
        color: var(--ek-text);
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-word;
      }

      /* Activity block */
      .activity-block {
        margin: 0 1.1rem 0.75rem;
        background: var(--ek-surface-2);
        border: 1px solid var(--ek-border);
        border-radius: 8px;
        padding: 0.85rem 1rem;
        display: flex;
        flex-wrap: wrap;
        gap: 1.25rem;
      }

      .activity-stat {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
      }

      .activity-stat-value {
        font-family: var(--ek-font-display);
        font-size: 1.35rem;
        letter-spacing: 0.04em;
        color: var(--ek-text);
        line-height: 1;
      }

      .activity-stat-label {
        font-size: 0.6rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--ek-text-dim);
      }

      .activity-sport-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        background: rgba(255, 101, 0, 0.1);
        border: 1px solid rgba(255, 101, 0, 0.25);
        color: var(--ek-accent);
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        padding: 0.2rem 0.6rem;
        border-radius: 100px;
        margin-bottom: 0.5rem;
        width: 100%;
      }

      /* Image */
      .post-image {
        width: 100%;
        max-height: 400px;
        object-fit: cover;
        display: block;
        border-top: 1px solid var(--ek-border);
        border-bottom: 1px solid var(--ek-border);
      }

      /* Event reference */
      .event-ref {
        margin: 0 1.1rem 0.75rem;
        background: var(--ek-surface-2);
        border: 1px solid var(--ek-border);
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        align-items: center;
        gap: 0;
      }

      .event-ref-banner {
        width: 72px;
        height: 56px;
        object-fit: cover;
        flex-shrink: 0;
      }

      .event-ref-placeholder {
        width: 72px;
        height: 56px;
        background: var(--ek-surface-3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        flex-shrink: 0;
      }

      .event-ref-info {
        padding: 0.5rem 0.75rem;
        min-width: 0;
      }

      .event-ref-sport {
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--ek-accent);
        margin-bottom: 0.15rem;
      }

      .event-ref-name {
        font-family: var(--ek-font-display);
        font-size: 0.9rem;
        letter-spacing: 0.04em;
        color: var(--ek-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* ─── Actions bar ─────────────────────────────────────── */
      .post-actions {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.5rem 0.9rem;
        border-top: 1px solid var(--ek-border);
      }

      .action-btn {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        background: none;
        border: none;
        color: var(--ek-text-muted);
        font-family: var(--ek-font-body);
        font-size: 0.78rem;
        font-weight: 600;
        padding: 0.4rem 0.7rem;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s;
      }

      .action-btn:hover {
        background: var(--ek-surface-2);
        color: var(--ek-text);
      }

      .action-btn-liked {
        color: #f87171;
      }

      .action-btn-liked:hover {
        background: rgba(248, 113, 113, 0.08);
        color: #f87171;
      }

      .action-count {
        font-size: 0.72rem;
        opacity: 0.85;
      }

      /* ─── Comments ────────────────────────────────────────── */
      .comments-section {
        border-top: 1px solid var(--ek-border);
        padding: 0.75rem 1.1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .comment-item {
        display: flex;
        gap: 0.6rem;
        align-items: flex-start;
      }

      .comment-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--ek-surface-2);
        border: 1px solid var(--ek-border);
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        color: var(--ek-text-muted);
        overflow: hidden;
      }

      .comment-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .comment-bubble {
        flex: 1;
        background: var(--ek-surface-2);
        border-radius: 8px;
        padding: 0.5rem 0.75rem;
      }

      .comment-author {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--ek-text);
        margin-bottom: 0.15rem;
      }

      .comment-text {
        font-size: 0.82rem;
        color: var(--ek-text-muted);
        line-height: 1.5;
      }

      .comment-time {
        font-size: 0.65rem;
        color: var(--ek-text-dim);
        margin-top: 0.2rem;
      }

      /* Comment compose */
      .comment-compose {
        display: flex;
        gap: 0.6rem;
        align-items: center;
        padding-top: 0.25rem;
      }

      .comment-input {
        flex: 1;
        background: var(--ek-surface-2);
        border: 1px solid var(--ek-border);
        color: var(--ek-text);
        font-family: var(--ek-font-body);
        font-size: 0.82rem;
        padding: 0.4rem 0.75rem;
        border-radius: 100px;
        outline: none;
        transition: border-color 0.15s;
      }

      .comment-input::placeholder {
        color: var(--ek-text-dim);
      }

      .comment-input:focus {
        border-color: var(--ek-accent);
      }

      .comment-send {
        background: var(--ek-accent);
        border: none;
        color: #fff;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background 0.15s;
      }

      .comment-send:hover:not(:disabled) {
        background: var(--ek-accent-hover);
      }

      .comment-send:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      /* ─── Loading / empty ─────────────────────────────────── */
      .skeleton-card {
        background: var(--ek-surface);
        border: 1px solid var(--ek-border);
        border-radius: 10px;
        padding: 1rem 1.1rem;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }

      .sk-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .sk-circle {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--ek-surface-2);
        animation: shimmer 1.8s ease-in-out infinite;
        flex-shrink: 0;
      }

      .sk-lines {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .sk-line {
        border-radius: 3px;
        background: var(--ek-surface-2);
        animation: shimmer 1.8s ease-in-out infinite;
      }

      @keyframes shimmer {
        0%,
        100% { opacity: 0.6; }
        50% { opacity: 0.3; }
      }

      .empty-timeline {
        text-align: center;
        padding: 4rem 2rem;
      }

      .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      .empty-title {
        font-family: var(--ek-font-display);
        font-size: 1.5rem;
        letter-spacing: 0.04em;
        color: var(--ek-text);
        margin-bottom: 0.5rem;
      }

      .empty-text {
        font-size: 0.85rem;
        color: var(--ek-text-muted);
        line-height: 1.55;
      }

      @media (max-width: 768px) {
        .layout {
          padding: 1rem 0.5rem;
        }
      }
    `,
  ],
  template: `
    <app-main-header />

    <main class="page">
      <div class="layout">

        <!-- ── Compose ─────────────────────────────────── -->
        <div class="compose" role="form" aria-label="Crear publicación">
          <div class="compose-header">
            <div class="compose-avatar" aria-hidden="true">
              <span>👤</span>
            </div>
            <textarea
              class="compose-textarea"
              [placeholder]="composePlaceholder()"
              [(ngModel)]="composeText"
              (input)="onComposeInput()"
              rows="2"
              maxlength="1000"
              aria-label="Texto de la publicación"
            ></textarea>
          </div>

          <!-- Type selector -->
          <div class="compose-types" role="group" aria-label="Tipo de publicación">
            @for (t of postTypes; track t.value) {
              <button
                class="type-pill"
                [class.type-pill-active]="composeType === t.value"
                (click)="setComposeType(t.value)"
              >
                {{ t.icon }} {{ t.label }}
              </button>
            }
          </div>

          <!-- Activity fields -->
          @if (composeType === 'ACTIVITY') {
            <div class="compose-activity" role="group" aria-label="Datos de actividad">
              <div class="activity-field">
                <label class="activity-label" for="act-sport">Deporte</label>
                <input
                  id="act-sport"
                  class="activity-input"
                  [(ngModel)]="activitySport"
                  placeholder="trail, ciclismo…"
                />
              </div>
              <div class="activity-field">
                <label class="activity-label" for="act-dist">Distancia (km)</label>
                <input
                  id="act-dist"
                  type="number"
                  class="activity-input"
                  [(ngModel)]="activityDistance"
                  placeholder="21.5"
                  min="0"
                />
              </div>
              <div class="activity-field">
                <label class="activity-label" for="act-pace">Ritmo</label>
                <input
                  id="act-pace"
                  class="activity-input"
                  [(ngModel)]="activityPace"
                  placeholder="5:30/km"
                />
              </div>
              <div class="activity-field">
                <label class="activity-label" for="act-elev">Desnivel (m)</label>
                <input
                  id="act-elev"
                  type="number"
                  class="activity-input"
                  [(ngModel)]="activityElevation"
                  placeholder="850"
                  min="0"
                />
              </div>
              <div class="activity-field">
                <label class="activity-label" for="act-dur">Tiempo (min)</label>
                <input
                  id="act-dur"
                  type="number"
                  class="activity-input"
                  [(ngModel)]="activityDuration"
                  placeholder="120"
                  min="0"
                />
              </div>
            </div>
          }

          <!-- Image URL -->
          @if (composeType === 'IMAGE') {
            <div class="compose-image-row">
              <input
                class="compose-image-input"
                [(ngModel)]="composeImageUrl"
                placeholder="URL de imagen…"
                type="url"
                aria-label="URL de imagen"
              />
            </div>
          }

          <div class="compose-footer">
            <span
              class="char-count"
              [class.char-count-warn]="composeText.length > 900"
              aria-live="polite"
            >
              {{ composeText.length }}/1000
            </span>
            <button
              class="btn-post"
              [disabled]="!canPost() || posting()"
              (click)="submitPost()"
              aria-label="Publicar"
            >
              {{ posting() ? 'Publicando…' : 'Publicar' }}
            </button>
          </div>
        </div>

        <!-- ── Feed ───────────────────────────────────── -->
        @if (loading()) {
          @for (s of skeletons; track s) {
            <div class="skeleton-card" aria-hidden="true">
              <div class="sk-header">
                <div class="sk-circle"></div>
                <div class="sk-lines">
                  <div class="sk-line" style="height: 14px; width: 40%"></div>
                  <div class="sk-line" style="height: 11px; width: 25%"></div>
                </div>
              </div>
              <div class="sk-line" style="height: 14px; width: 85%"></div>
              <div class="sk-line" style="height: 14px; width: 65%"></div>
            </div>
          }
        } @else if (posts().length === 0) {
          <div class="empty-timeline" role="status">
            <div class="empty-icon">🏃</div>
            <p class="empty-title">Sin actividad</p>
            <p class="empty-text">
              Aquí verás las publicaciones tuyas y de las personas que sigues.
              ¡Empieza publicando algo!
            </p>
          </div>
        } @else {
          @for (post of posts(); track post.id) {
            <article class="post-card" [attr.aria-label]="'Post de ' + post.user.firstName">

              <!-- Header -->
              <div class="post-header">
                <div class="post-avatar" aria-hidden="true">
                  @if (post.user.avatarUrl) {
                    <img [src]="post.user.avatarUrl" [alt]="post.user.firstName" />
                  } @else {
                    <span>{{ userInitial(post.user) }}</span>
                  }
                </div>
                <div class="post-meta">
                  <p class="post-author">
                    {{ post.user.firstName }} {{ post.user.lastName }}
                    @if (post.user.username) {
                      <span style="color: var(--ek-text-dim); font-weight: 400">
                        &#64;{{ post.user.username }}
                      </span>
                    }
                  </p>
                  <p class="post-time">{{ post.createdAt | date: 'dd MMM yyyy, HH:mm' : '' : 'es' }}</p>
                </div>
                <span
                  class="post-type-badge"
                  [style.color]="typeBadgeColor(post.type)"
                  [style.border-color]="typeBadgeColor(post.type) + '40'"
                  [style.background]="typeBadgeColor(post.type) + '12'"
                >
                  {{ typeLabel(post.type) }}
                </span>
              </div>

              <!-- Text -->
              <p class="post-text">{{ post.text }}</p>

              <!-- Activity block -->
              @if (post.type === 'ACTIVITY' && post.activityData) {
                <div class="activity-block" aria-label="Datos de actividad">
                  <span class="activity-sport-chip">
                    {{ sportEmoji(post.activityData.sport) }}
                    {{ post.activityData.sport }}
                  </span>
                  @if (post.activityData.distance) {
                    <div class="activity-stat">
                      <span class="activity-stat-value">{{ post.activityData.distance | number: '1.1-1' }} km</span>
                      <span class="activity-stat-label">Distancia</span>
                    </div>
                  }
                  @if (post.activityData.pace) {
                    <div class="activity-stat">
                      <span class="activity-stat-value">{{ post.activityData.pace }}</span>
                      <span class="activity-stat-label">Ritmo</span>
                    </div>
                  }
                  @if (post.activityData.elevation) {
                    <div class="activity-stat">
                      <span class="activity-stat-value">{{ post.activityData.elevation }} m</span>
                      <span class="activity-stat-label">Desnivel</span>
                    </div>
                  }
                  @if (post.activityData.duration) {
                    <div class="activity-stat">
                      <span class="activity-stat-value">{{ formatDuration(post.activityData.duration) }}</span>
                      <span class="activity-stat-label">Tiempo</span>
                    </div>
                  }
                </div>
              }

              <!-- Image -->
              @if (post.imageUrl) {
                <img
                  class="post-image"
                  [src]="post.imageUrl"
                  [alt]="'Imagen de ' + post.user.firstName"
                  loading="lazy"
                />
              }

              <!-- Event ref -->
              @if (post.type === 'EVENT_REF' && post.sportEvent) {
                <div class="event-ref" role="region" [attr.aria-label]="post.sportEvent.name">
                  @if (post.sportEvent.bannerUrl) {
                    <img
                      class="event-ref-banner"
                      [src]="post.sportEvent.bannerUrl"
                      [alt]="post.sportEvent.name"
                    />
                  } @else {
                    <div class="event-ref-placeholder" aria-hidden="true">
                      {{ sportEmoji(post.sportEvent.sportType) }}
                    </div>
                  }
                  <div class="event-ref-info">
                    <p class="event-ref-sport">{{ post.sportEvent.sportType }}</p>
                    <p class="event-ref-name">{{ post.sportEvent.name }}</p>
                  </div>
                </div>
              }

              <!-- Actions -->
              <div class="post-actions">
                <button
                  class="action-btn"
                  [class.action-btn-liked]="post.isLikedByMe"
                  (click)="toggleLike(post)"
                  [attr.aria-label]="post.isLikedByMe ? 'Quitar like' : 'Dar like'"
                  [attr.aria-pressed]="post.isLikedByMe"
                >
                  {{ post.isLikedByMe ? '❤️' : '🤍' }}
                  <span class="action-count">{{ post.likesCount }}</span>
                </button>
                <button
                  class="action-btn"
                  (click)="toggleComments(post.id)"
                  [attr.aria-expanded]="openComments().has(post.id)"
                  aria-label="Ver comentarios"
                >
                  💬
                  <span class="action-count">{{ post.commentsCount }}</span>
                </button>
              </div>

              <!-- Comments -->
              @if (openComments().has(post.id)) {
                <div class="comments-section">
                  @for (c of commentsMap().get(post.id) ?? []; track c.id) {
                    <div class="comment-item">
                      <div class="comment-avatar" aria-hidden="true">
                        @if (c.user.avatarUrl) {
                          <img [src]="c.user.avatarUrl" [alt]="c.user.firstName" />
                        } @else {
                          <span>{{ userInitial(c.user) }}</span>
                        }
                      </div>
                      <div class="comment-bubble">
                        <p class="comment-author">{{ c.user.firstName }} {{ c.user.lastName }}</p>
                        <p class="comment-text">{{ c.text }}</p>
                        <p class="comment-time">{{ c.createdAt | date: 'dd MMM, HH:mm' : '' : 'es' }}</p>
                      </div>
                    </div>
                  }

                  <!-- Comment input -->
                  <div class="comment-compose">
                    <div class="comment-avatar" aria-hidden="true">
                      <span>👤</span>
                    </div>
                    <input
                      class="comment-input"
                      [placeholder]="'Añade un comentario…'"
                      [(ngModel)]="commentDraft[post.id]"
                      (keydown.enter)="submitComment(post)"
                      maxlength="500"
                      [attr.aria-label]="'Comentar en post de ' + post.user.firstName"
                    />
                    <button
                      class="comment-send"
                      [disabled]="!commentDraft[post.id]?.trim()"
                      (click)="submitComment(post)"
                      aria-label="Enviar comentario"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              }

            </article>
          }
        }

      </div>
    </main>
  `,
})
export class TimelinePage {
  private readonly postService = inject(PostService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly loading = signal(true);
  readonly posting = signal(false);
  readonly posts = signal<Post[]>([]);
  readonly openComments = signal<Set<string>>(new Set());
  readonly commentsMap = signal<Map<string, PostComment[]>>(new Map());
  readonly skeletons = [1, 2, 3, 4];

  composeText = '';
  composeType: 'TEXT' | 'IMAGE' | 'EVENT_REF' | 'ACTIVITY' = 'TEXT';
  composeImageUrl = '';
  activitySport = '';
  activityDistance: number | null = null;
  activityPace = '';
  activityElevation: number | null = null;
  activityDuration: number | null = null;
  commentDraft: Record<string, string> = {};

  readonly postTypes = [
    { value: 'TEXT' as const, label: 'Texto', icon: '✍️' },
    { value: 'IMAGE' as const, label: 'Imagen', icon: '🖼️' },
    { value: 'ACTIVITY' as const, label: 'Actividad', icon: '⚡' },
    { value: 'EVENT_REF' as const, label: 'Evento', icon: '🏆' },
  ];

  readonly canPost = computed(() => this.composeText.trim().length > 0);

  composePlaceholder(): string {
    const map: Record<string, string> = {
      TEXT: '¿Qué está pasando?',
      IMAGE: 'Comparte una imagen con descripción…',
      ACTIVITY: 'Describe tu actividad…',
      EVENT_REF: 'Menciona un evento…',
    };
    return map[this.composeType];
  }

  constructor() {
    if (this.isBrowser) {
      this.loadFeed();
    } else {
      this.loading.set(false);
    }
  }

  private loadFeed(): void {
    this.loading.set(true);
    this.postService
      .getFeed()
      .pipe(catchError(() => of([] as Post[])))
      .subscribe((data) => {
        this.posts.set(data);
        this.loading.set(false);
      });
  }

  setComposeType(type: 'TEXT' | 'IMAGE' | 'EVENT_REF' | 'ACTIVITY'): void {
    this.composeType = type;
  }

  onComposeInput(): void {
    // triggers change detection on signal-less ngModel binding
  }

  submitPost(): void {
    if (!this.canPost() || this.posting()) return;

    const payload: Parameters<PostService['createPost']>[0] = {
      text: this.composeText.trim(),
      type: this.composeType,
    };

    if (this.composeType === 'IMAGE' && this.composeImageUrl.trim()) {
      payload.imageUrl = this.composeImageUrl.trim();
    }

    if (this.composeType === 'ACTIVITY') {
      const activityData: ActivityData = { sport: this.activitySport || 'deporte' };
      if (this.activityDistance) activityData.distance = this.activityDistance;
      if (this.activityPace) activityData.pace = this.activityPace;
      if (this.activityElevation) activityData.elevation = this.activityElevation;
      if (this.activityDuration) activityData.duration = this.activityDuration * 60;
      payload.activityData = activityData;
    }

    this.posting.set(true);
    this.postService
      .createPost(payload)
      .pipe(catchError(() => of(null)))
      .subscribe((post) => {
        this.posting.set(false);
        if (post) {
          this.posts.update((prev) => [post, ...prev]);
          this.composeText = '';
          this.composeType = 'TEXT';
          this.composeImageUrl = '';
          this.activitySport = '';
          this.activityDistance = null;
          this.activityPace = '';
          this.activityElevation = null;
          this.activityDuration = null;
        }
      });
  }

  toggleLike(post: Post): void {
    const wasLiked = post.isLikedByMe;
    this.posts.update((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              isLikedByMe: !wasLiked,
              likesCount: wasLiked ? p.likesCount - 1 : p.likesCount + 1,
            }
          : p,
      ),
    );

    const req = wasLiked
      ? this.postService.unlikePost(post.id)
      : this.postService.likePost(post.id);

    req.pipe(catchError(() => {
      this.posts.update((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, isLikedByMe: wasLiked, likesCount: wasLiked ? p.likesCount + 1 : p.likesCount - 1 }
            : p,
        ),
      );
      return of(undefined);
    })).subscribe();
  }

  toggleComments(postId: string): void {
    const current = new Set(this.openComments());
    if (current.has(postId)) {
      current.delete(postId);
      this.openComments.set(current);
    } else {
      current.add(postId);
      this.openComments.set(current);
      if (!this.commentsMap().has(postId)) {
        this.loadComments(postId);
      }
    }
  }

  private loadComments(postId: string): void {
    this.postService
      .getComments(postId)
      .pipe(catchError(() => of([] as PostComment[])))
      .subscribe((comments) => {
        this.commentsMap.update((m) => {
          const next = new Map(m);
          next.set(postId, comments);
          return next;
        });
      });
  }

  submitComment(post: Post): void {
    const text = this.commentDraft[post.id]?.trim();
    if (!text) return;

    this.commentDraft[post.id] = '';
    this.postService
      .addComment(post.id, text)
      .pipe(catchError(() => of(null)))
      .subscribe((comment) => {
        if (comment) {
          this.commentsMap.update((m) => {
            const next = new Map(m);
            const existing = next.get(post.id) ?? [];
            next.set(post.id, [...existing, comment]);
            return next;
          });
          this.posts.update((prev) =>
            prev.map((p) =>
              p.id === post.id
                ? { ...p, commentsCount: p.commentsCount + 1 }
                : p,
            ),
          );
        }
      });
  }

  userInitial(user: { firstName: string }): string {
    return user.firstName?.[0]?.toUpperCase() ?? '?';
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      TEXT: 'post',
      IMAGE: 'foto',
      ACTIVITY: 'actividad',
      EVENT_REF: 'evento',
    };
    return map[type] ?? type;
  }

  typeBadgeColor(type: string): string {
    const map: Record<string, string> = {
      TEXT: '#94a3b8',
      IMAGE: '#818cf8',
      ACTIVITY: '#ff6500',
      EVENT_REF: '#4ade80',
    };
    return map[type] ?? '#94a3b8';
  }

  sportEmoji(sport: string): string {
    const map: Record<string, string> = {
      trail: '🏔️',
      running: '🏃',
      ciclismo: '🚴',
      cycling: '🚴',
      triathlon: '🏊',
      swimming: '🏊',
      hiking: '🥾',
      padel: '🎾',
      surf: '🏄',
      deporte: '⚡',
    };
    return map[sport?.toLowerCase()] ?? '⚡';
  }

  formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
}
