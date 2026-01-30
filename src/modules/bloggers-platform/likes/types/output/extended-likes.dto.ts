import { NewestLike } from 'src/modules/bloggers-platform/likes/types/output/newest-likes.dto';

export interface ExtendedLikesInfo {
  likesCount: number;
  dislikesCount: number;
  myStatus: string;
  newestLikes: NewestLike[];
}
