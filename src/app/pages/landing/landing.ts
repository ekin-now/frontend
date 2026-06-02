import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { TuiButton } from '@taiga-ui/core';
import { AuthService } from '../../core/services/auth.service';
import { LanguageSwitcher } from '../../shared/language-switcher/language-switcher';

@Component({
  selector: 'app-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoPipe, TuiButton, LanguageSwitcher],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingPage {
  protected readonly auth = inject(AuthService);
}
