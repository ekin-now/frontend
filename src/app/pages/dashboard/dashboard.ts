import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TuiIcon, TuiDataList, TuiDropdown } from '@taiga-ui/core';
import { AuthService } from '../../core/services/auth.service';

type EventStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'REGISTRATIONS_OPEN'
  | 'FULL'
  | 'FINISHED'
  | 'CANCELLED';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

interface MetricCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
  color: string;
}

interface UpcomingEvent {
  name: string;
  date: string;
  location: string;
  status: EventStatus;
  registered: number;
  capacity: number;
}

interface PendingItem {
  initials: string;
  name: string;
  event: string;
  sub: string;
  type: 'new' | 'waitlist' | 'manual' | 'cancellation';
  time: string;
}

interface ActivityItem {
  type: 'registration' | 'payment' | 'published' | 'result' | 'cancellation';
  text: string;
  time: string;
}

interface SvgPoint {
  x: number;
  y: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: '@tui.gauge', route: '/dashboard' },
  { label: 'Eventos', icon: '@tui.calendar', route: '/dashboard/events' },
  { label: 'Inscripciones', icon: '@tui.clipboard', route: '/dashboard/registrations', badge: 23 },
  { label: 'Participantes', icon: '@tui.users', route: '/dashboard/participants' },
  { label: 'Pagos', icon: '@tui.credit-card', route: '/dashboard/payments', badge: 3 },
  { label: 'Resultados', icon: '@tui.trophy', route: '/dashboard/results' },
  { label: 'Estadísticas', icon: '@tui.bar-chart-2', route: '/dashboard/stats' },
  { label: 'Assets', icon: '@tui.image', route: '/dashboard/assets' },
  { label: 'Empresas', icon: '@tui.building-2', route: '/dashboard/companies' },
  { label: 'Soporte', icon: '@tui.life-buoy', route: '/dashboard/support' },
  { label: 'Configuración', icon: '@tui.settings', route: '/dashboard/settings' },
];

const METRICS: MetricCard[] = [
  { label: 'Eventos activos', value: '12', change: '+2 este mes', positive: true, icon: '@tui.calendar', color: '#3b82f6' },
  { label: 'Próximos eventos', value: '4', change: '2 esta semana', positive: true, icon: '@tui.clock', color: '#8b5cf6' },
  { label: 'Participantes totales', value: '2.847', change: '+342 vs mes anterior', positive: true, icon: '@tui.users', color: '#10b981' },
  { label: 'Inscripciones pendientes', value: '23', change: '+8 últimas 24h', positive: false, icon: '@tui.clipboard', color: '#f59e0b' },
  { label: 'Ingresos del mes', value: '€18.450', change: '+18% vs mes anterior', positive: true, icon: '@tui.trending-up', color: '#ff6500' },
  { label: 'Pagos fallidos', value: '3', change: '-5 vs mes anterior', positive: true, icon: '@tui.alert-circle', color: '#ef4444' },
];

const UPCOMING_EVENTS: UpcomingEvent[] = [
  { name: 'Maratón Ciudad de Madrid 2026', date: '22 Jun 2026', location: 'Madrid, España', status: 'REGISTRATIONS_OPEN', registered: 842, capacity: 1000 },
  { name: 'Triatlón Nacional Costa Brava', date: '5 Jul 2026', location: 'Girona, España', status: 'PUBLISHED', registered: 156, capacity: 300 },
  { name: 'Trail Montaña Guadarrama', date: '19 Jul 2026', location: 'Segovia, España', status: 'REGISTRATIONS_OPEN', registered: 280, capacity: 350 },
  { name: 'Cicloturista Costa de la Luz', date: '2 Ago 2026', location: 'Cádiz, España', status: 'DRAFT', registered: 0, capacity: 500 },
  { name: 'Duatlón Primavera Sevilla', date: '16 Ago 2026', location: 'Sevilla, España', status: 'FULL', registered: 200, capacity: 200 },
];

const PENDING_ITEMS: PendingItem[] = [
  { initials: 'AL', name: 'Ana López', event: 'Maratón Madrid', sub: '42K', type: 'new', time: 'hace 5 min' },
  { initials: 'CR', name: 'Carlos Ruiz', event: 'Trail Guadarrama', sub: '30K', type: 'waitlist', time: 'hace 23 min' },
  { initials: 'MG', name: 'María García', event: 'Triatlón Costa Brava', sub: 'Olímpico', type: 'manual', time: 'hace 1h' },
  { initials: 'JP', name: 'Javier Pérez', event: 'Duatlón Sevilla', sub: 'Estándar', type: 'cancellation', time: 'hace 2h' },
  { initials: 'LF', name: 'Laura Fernández', event: 'Maratón Madrid', sub: 'Media Maratón', type: 'new', time: 'hace 3h' },
];

const ACTIVITY_ITEMS: ActivityItem[] = [
  { type: 'registration', text: 'Nueva inscripción de Ana López en Maratón Madrid', time: 'hace 5 min' },
  { type: 'payment', text: 'Pago confirmado €85 — Carlos Ruiz, Trail Guadarrama', time: 'hace 12 min' },
  { type: 'published', text: 'Evento "Triatlón Costa Brava" publicado', time: 'hace 1h' },
  { type: 'registration', text: '3 nuevas inscripciones en Trail Montaña', time: 'hace 2h' },
  { type: 'result', text: 'Resultados subidos — Duatlón Primavera Sevilla', time: 'hace 3h' },
  { type: 'cancellation', text: 'Javier Pérez canceló inscripción en Duatlón Sevilla', time: 'hace 4h' },
  { type: 'payment', text: 'Pago fallido — María García, Triatlón Costa Brava', time: 'hace 5h' },
  { type: 'published', text: 'Evento "Cicloturista Costa de la Luz" creado en borrador', time: 'hace 6h' },
];

const MONTHLY_REVENUE = [8400, 11200, 9800, 14300, 12100, 16800, 15200, 18450, 13600, 17800, 16900, 18450];
const MONTHS = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  REGISTRATIONS_OPEN: 'Inscripciones abiertas',
  FULL: 'Completo',
  FINISHED: 'Finalizado',
  CANCELLED: 'Cancelado',
};

const PENDING_TYPE_LABELS: Record<PendingItem['type'], string> = {
  new: 'Nueva inscripción',
  waitlist: 'Lista de espera',
  manual: 'Validación manual',
  cancellation: 'Cancelación',
};

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, TuiIcon, ...TuiDropdown, TuiDataList],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  host: { '[class.sidebar-collapsed]': 'sidebarCollapsed()' },
})
export class DashboardPage {
  private readonly auth = inject(AuthService);

  protected readonly sidebarCollapsed = signal(false);
  protected readonly menuOpen = signal(false);
  protected readonly notificationCount = signal(7);

  protected readonly navItems = NAV_ITEMS;
  protected readonly metrics = METRICS;
  protected readonly upcomingEvents = UPCOMING_EVENTS;
  protected readonly pendingItems = PENDING_ITEMS;
  protected readonly activityItems = ACTIVITY_ITEMS;
  protected readonly months = MONTHS;

  protected readonly currentUser = this.auth.currentUser;

  protected readonly userInitials = computed(() => {
    const email = this.currentUser()?.email ?? '';
    const [local] = email.split('@');
    const parts = local.split(/[._-]/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : local.slice(0, 2).toUpperCase();
  });

  protected readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  protected readonly today = computed(() =>
    new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date()),
  );

  protected readonly svgData = computed(() => {
    const data = MONTHLY_REVENUE;
    const min = Math.min(...data) * 0.88;
    const max = Math.max(...data) * 1.04;
    const range = max - min;
    const w = 420;
    const h = 100;
    const padX = 6;
    const padY = 10;

    const pts: SvgPoint[] = data.map((v, i) => ({
      x: padX + (i / (data.length - 1)) * (w - padX * 2),
      y: padY + (1 - (v - min) / range) * (h - padY * 2),
    }));

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const fill = `${line} L ${pts[pts.length - 1].x},${h} L ${pts[0].x},${h} Z`;

    return { pts, line, fill, w, h, lastPt: pts[pts.length - 1] };
  });

  protected readonly barData = computed(() => {
    const data = MONTHLY_REVENUE;
    const max = Math.max(...data);
    return data.map((v, i) => ({
      pct: Math.round((v / max) * 100),
      value: v,
      month: MONTHS[i],
      current: i === data.length - 1,
    }));
  });

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  protected logout(): void {
    this.auth.logout();
  }

  protected getStatusLabel(status: EventStatus): string {
    return STATUS_LABELS[status];
  }

  protected getStatusClass(status: EventStatus): string {
    return 'status-' + status.toLowerCase().replaceAll('_', '-');
  }

  protected getCapacityPct(registered: number, capacity: number): number {
    return capacity ? Math.round((registered / capacity) * 100) : 0;
  }

  protected getPendingTypeLabel(type: PendingItem['type']): string {
    return PENDING_TYPE_LABELS[type];
  }
}
