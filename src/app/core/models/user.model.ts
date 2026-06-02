export interface User {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  birthDate?: string;
  isActive: boolean;
  isVerified: boolean;
  gender?: string;
  country?: string;
  city?: string;
  bio?: string;
  instagram?: string;
  strava?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string;
  phone?: string;
  birthDate?: string;
}
