export type LikeStatus = 'None' | 'Like' | 'Dislike';

export type FieldError = { message: string; field: string };

export type ApiErrorBody = {
  errorsMessages?: FieldError[];
  message?: string;
};

export type Paginated<T> = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: T[];
};

export type Blog = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
};

export type NewestLike = {
  addedAt: string;
  userId: string;
  login: string;
};

export type Post = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatus;
    newestLikes: NewestLike[];
  };
};

export type Comment = {
  id: string;
  content: string;
  commentatorInfo: { userId: string; userLogin: string };
  createdAt: string;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatus;
  };
};

export type Me = {
  login: string;
  email: string;
  userId: string;
};

export type DeviceSession = {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;
};

export type PaginationQuery = {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchNameTerm?: string;
  searchPostNameTerm?: string;
};
