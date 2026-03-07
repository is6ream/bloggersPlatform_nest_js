export type LikeStatus = 'None' | 'Like' | 'Dislike';

export interface Paginator<T> {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: T[];
}

export interface Blog {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
}

export interface NewestLike {
  addedAt: string;
  userId: string;
  login: string;
}

export interface ExtendedLikesInfo {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
  newestLikes: NewestLike[];
}

export interface Post {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: ExtendedLikesInfo;
}

export interface LikesInfo {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
}

export interface Comment {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
  likesInfo: LikesInfo;
}

export interface User {
  id: string;
  login: string;
  email: string;
  createdAt: string;
}

export interface MeResponse {
  userId: string;
  login: string;
  email: string;
}

export interface DeviceSession {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;
}

export interface QueryParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchNameTerm?: string;
  searchLoginTerm?: string;
  searchEmailTerm?: string;
}
