import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
const API = 'http://localhost:3000';

export interface FollowEntry {
  followerId: string;
  followingId: string;
  user: { id: string; firstName: string; lastName: string; username?: string; avatarUrl?: string };
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class FollowService {
  private readonly http = inject(HttpClient);

  follow(userId: string): Observable<void> {
    return this.http.post<void>(`${API}/follows/${userId}`, {});
  }

  unfollow(userId: string): Observable<void> {
    return this.http.delete<void>(`${API}/follows/${userId}`);
  }

  getFollowers(): Observable<FollowEntry[]> {
    return this.http.get<FollowEntry[]>(`${API}/follows/followers`);
  }

  getFollowing(): Observable<FollowEntry[]> {
    return this.http.get<FollowEntry[]>(`${API}/follows/following`);
  }
}
