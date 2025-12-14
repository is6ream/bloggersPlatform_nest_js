import { NewestLikes } from 'src/modules/bloggers-platform/likes/types/newestLikes';

export class PostViewModel {
  id: string;
  title: string;
  shortDescriprion: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: string;
    newestLikes: NewestLikes[];
  };
}
