import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideTransloco } from '@jsverse/transloco';
import { provideTaiga } from '@taiga-ui/core';
import { tuiLanguageSwitcher } from '@taiga-ui/i18n';
import type { TuiLanguage, TuiLanguageName } from '@taiga-ui/i18n';

registerLocaleData(localeEs);

import { routes } from './app.routes';
import { TranslocoHttpLoader } from './transloco-loader';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideTaiga(),
    ...tuiLanguageSwitcher(async (language: TuiLanguageName): Promise<TuiLanguage> => {
      switch (language) {
        case 'spanish':
          return (await import('@taiga-ui/i18n/languages/spanish')).TUI_SPANISH_LANGUAGE;
        case 'french':
          return (await import('@taiga-ui/i18n/languages/french')).TUI_FRENCH_LANGUAGE;
        default:
          return (await import('@taiga-ui/i18n/languages/english')).TUI_ENGLISH_LANGUAGE;
      }
    }),
    provideTransloco({
      config: {
        availableLangs: ['es', 'en', 'eu', 'fr'],
        defaultLang: 'es',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
