import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { TuiButton } from '@taiga-ui/core';
import { TuiLanguageSwitcherService } from '@taiga-ui/i18n';
import type { TuiLanguageName } from '@taiga-ui/i18n';
import { toSignal } from '@angular/core/rxjs-interop';

const LANG_TO_TUI: Record<string, TuiLanguageName> = {
  es: 'spanish',
  en: 'english',
  eu: 'spanish',
  fr: 'french',
};

interface Language {
  code: string;
  label: string;
}

@Component({
  selector: 'app-language-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiButton],
  template: `
    @for (lang of languages; track lang.code) {
      <button
        tuiButton
        size="s"
        [appearance]="activeLang() === lang.code ? 'primary' : 'outline'"
        (click)="setLanguage(lang.code)"
      >
        {{ lang.label }}
      </button>
    }
  `,
  styles: [`
    :host {
      display: flex;
      gap: 0.5rem;
    }
  `],
})
export class LanguageSwitcher {
  private readonly transloco = inject(TranslocoService);
  private readonly tuiSwitcher = inject(TuiLanguageSwitcherService);

  protected readonly languages: Language[] = [
    { code: 'es', label: 'ES' },
    { code: 'en', label: 'EN' },
    { code: 'eu', label: 'EU' },
    { code: 'fr', label: 'FR' },
  ];

  protected readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected setLanguage(code: string): void {
    this.transloco.setActiveLang(code);
    this.tuiSwitcher.setLanguage(LANG_TO_TUI[code] ?? 'english');
  }
}
