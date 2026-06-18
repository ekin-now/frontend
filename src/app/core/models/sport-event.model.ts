export interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  email?: string;
  logoUrl?: string;
  bannerUrl?: string;
  country?: string;
  city?: string;
  sportType?: string;
  companyType?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SportSubEvent {
  id: string;
  sportEventId: string;
  name: string;
  shortDescription: string;
  description: string;
  status: string;
  distanceKm?: number;
  elevationGainMeters?: number;
  capacity: number;
  registeredParticipants: number;
  price: number;
  currency: string;
  startDateTime: string;
  timeLimitMinutes?: number;
  minimumAge?: number;
  maximumAge?: number;
  gpxUrl?: string;
  coverImageUrl?: string;
  bibNumberRequired: boolean;
  bibStartNumber?: number;
  bibEndNumber?: number;
  registrationOpenAt?: string;
  registrationCloseAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SportEventDetail extends SportEvent {
  company: Company;
  subEvents: SportSubEvent[];
}

export interface SportEvent {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  sportType: string;
  status: string;
  eventDate: string;
  registrationOpenAt: string | null;
  registrationCloseAt: string | null;
  country: string;
  region: string;
  city: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  bannerUrl: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  rulesDocumentUrl: string | null;
  featured: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilterOptions {
  sportTypes: string[];
  countries: string[];
  regions: string[];
}

export interface EventFilters {
  sportType?: string;
  country?: string;
  region?: string;
  dateFrom?: string;
  dateTo?: string;
}