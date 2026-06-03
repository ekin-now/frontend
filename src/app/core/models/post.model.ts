export type PostType = 'TEXT' | 'IMAGE' | 'EVENT_REF' | 'ACTIVITY';

export interface ActivityData {
  sport: string;
  distance?: number;
  duration?: number;
  pace?: string;
  elevation?: number;
}

export interface UserMini {
  id: string;
  firstName: string;
  lastName: string;
  username?: string;
  avatarUrl?: string;
}

export interface SportEventMini {
  id: string;
  name: string;
  slug: string;
  sportType: string;
  bannerUrl?: string;
}

export interface Post {
  id: string;
  text: string;
  imageUrl?: string;
  type: PostType;
  activityData?: ActivityData;
  sportEventId?: string;
  sportEvent?: SportEventMini;
  userId: string;
  user: UserMini;
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostComment {
  id: string;
  text: string;
  postId: string;
  userId: string;
  user: UserMini;
  createdAt: string;
}

export interface CreatePostPayload {
  text: string;
  imageUrl?: string;
  type?: PostType;
  activityData?: ActivityData;
  sportEventId?: string;
}
