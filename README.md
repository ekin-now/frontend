# Ekinnow Frontend

Angular 21 SPA for the Ekinnow sports events platform. Handles auth (login/register), a public landing page, and will host the participant/company dashboards.

## Stack

- **Angular 21** standalone components, `ChangeDetectionStrategy.OnPush`, signals, `inject()`
- **TaigaUI v5** component library (dark theme via CSS custom properties)
- **Transloco** i18n — 4 languages: Spanish (`es`), English (`en`), Euskera (`eu`), French (`fr`)
- **Angular SSR** (`@angular/ssr`) — all routes set to `RenderMode.Client`
- **Reactive Forms** — `NonNullableFormBuilder`, functional validators
- **JWT** auth — `HttpInterceptorFn` + `CanActivateFn` guard + `localStorage` token storage

## Running

```bash
npm install
npm run start        # dev server at http://localhost:4200
```

Backend must be running at `http://localhost:3000` (see `/backend/README.md`).

Build for production:

```bash
npm run build
npm run serve:ssr:frontend   # SSR production server
```

## Project structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          auth.guard.ts           — CanActivateFn, redirects to /login
│   │   ├── interceptors/    auth.interceptor.ts     — attaches Bearer token to every request
│   │   ├── models/          jwt-payload.model.ts, user.model.ts
│   │   └── services/
│   │       ├── auth.service.ts    — login(), register(), logout(), currentUser signal
│   │       └── token.service.ts   — localStorage wrapper + JWT payload decode + expiry check
│   ├── pages/
│   │   ├── landing/         landing.ts / .html / .css  — public marketing page
│   │   └── auth/
│   │       ├── login/       login.ts
│   │       └── register/    register.ts
│   ├── shared/
│   │   └── language-switcher/   — 4-button language selector (syncs Transloco + TaigaUI i18n)
│   ├── app.config.ts        — provideRouter, provideHttpClient, provideTaiga, provideTransloco
│   ├── app.config.server.ts — SSR providers (WA_WINDOW mock for TaigaUI + matchMedia)
│   └── app.routes.ts        — lazy-loaded routes
└── public/
    └── assets/
        └── i18n/            — es.json, en.json, eu.json, fr.json
```

## Routes

| Path        | Component    | Guard |
|-------------|--------------|-------|
| `/`         | LandingPage  | —     |
| `/login`    | LoginPage    | —     |
| `/register` | RegisterPage | —     |

## i18n

Translation files live in `public/assets/i18n/<lang>.json`. Keys are namespaced by feature: `common`, `nav`, `auth`, `landing`, `events`.

To add a new language: add the locale code to `availableLangs` in `app.config.ts`, add the corresponding JSON file, and update `LANG_TO_TUI` in `language-switcher.ts` to map it to the nearest TaigaUI language pack.

## Auth flow

1. `POST /auth/login` → backend returns `{ access_token }` JWT
2. `TokenService` stores token in `localStorage`, decodes payload (sub, email, role, companyId)
3. `AuthService.currentUser` signal holds the decoded payload; `isAuthenticated` is a `computed()`
4. `authInterceptor` reads the token and sets `Authorization: Bearer <token>` on every outbound request
5. `authGuard` redirects to `/login` if `isAuthenticated()` is false

## Code conventions

- No `standalone: true` in decorators (default in Angular v20+)
- `ChangeDetectionStrategy.OnPush` on every component
- `inject()` over constructor injection
- `input()` / `output()` functions over `@Input` / `@Output` decorators
- Native control flow: `@if`, `@for`, `@switch`
- No comments unless the WHY is non-obvious

## Environment

Backend API base URL is hardcoded to `http://localhost:3000` in `auth.service.ts`. For production, replace with an environment variable via Angular's `environment.ts` before deploying.
