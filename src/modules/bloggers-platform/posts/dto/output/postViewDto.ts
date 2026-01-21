import { NewestLikes } from 'src/modules/bloggers-platform/likes/types/newest-likes';
import { PostDocument } from '../../domain/postEntity';

export class PostViewDto {
  id: string;
  title: string;
  shortDescription: string;
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

  static mapToView(post: PostDocument): PostViewDto {
    const dto = new this();

    dto.id = post._id.toString();
    dto.title = post.title;
    dto.shortDescription = post.shortDescription;
    dto.content = post.content;
    dto.blogId = post.blogId;
    dto.blogName = post.blogName;
    dto.createdAt = post.createdAt;

    dto.extendedLikesInfo = {
      likesCount: post.likesInfo.likesCount,
      dislikesCount: post.likesInfo.dislikesCount,
      myStatus: post.likesInfo.status,
      newestLikes: post.likesInfo.newestLikes,
    };

    return dto;
  }
}
