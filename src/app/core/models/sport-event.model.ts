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