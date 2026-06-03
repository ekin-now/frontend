import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post, PostComment, CreatePostPayload } from '../models/post.model';
const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly http = inject(HttpClient);

  getFeed(page = 1, limit = 20): Observable<Post[]> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit);
    return this.http.get<Post[]>(`${API}/posts/feed`, { params });
  }

  createPost(payload: CreatePostPayload): Observable<Post> {
    return this.http.post<Post>(`${API}/posts`, payload);
  }

  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/posts/${id}`);
  }

  likePost(id: string): Observable<void> {
    return this.http.post<void>(`${API}/posts/${id}/likes`, {});
  }

  unlikePost(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/posts/${id}/likes`);
  }

  getComments(postId: string): Observable<PostComment[]> {
    return this.http.get<PostComment[]>(`${API}/posts/${postId}/comments`);
  }

  addComment(postId: string, text: string): Observable<PostComment> {
    return this.http.post<PostComment>(`${API}/posts/${postId}/comments`, { text });
  }

  deleteComment(postId: string, commentId: string): Observable<void> {
    return this.http.delete<void>(`${API}/posts/${postId}/comments/${commentId}`);
  }
}
