import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventFilters, FilterOptions, SportEvent } from '../models/sport-event.model';

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class EventsService {
  private readonly http = inject(HttpClient);

  getEvents(filters: EventFilters = {}): Observable<SportEvent[]> {
    let params = new HttpParams();
    if (filters.sportType) params = params.set('sportType', filters.sportType);
    if (filters.country) params = params.set('country', filters.country);
    if (filters.region) params = params.set('region', filters.region);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    return this.http.get<SportEvent[]>(`${API}/sport-events`, { params });
  }

  getFilterOptions(country?: string): Observable<FilterOptions> {
    let params = new HttpParams();
    if (country) params = params.set('country', country);
    return this.http.get<FilterOptions>(`${API}/sport-events/filter-options`, { params });
  }
}