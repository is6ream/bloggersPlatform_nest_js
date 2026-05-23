import { LikesOrmEntity } from '../../likes/domain/like.orm-entity';
import { CommentViewModel } from '../../posts/api/model/output/commentViewModel';
import { CommentsOrmEntity } from '../domain/comment.orm-entity';

export class CommentViewDto extends CommentViewModel {
  static mapToView(
    comment: CommentsOrmEntity,
    like?: LikesOrmEntity | null,
  ): CommentViewDto {
    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.commentatorInfo.userId,
        userLogin: comment.commentatorInfo.userLogin,
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: comment.likesCount,
        dislikesCount: comment.dislikesCount,
        myStatus: like?.status ?? 'None',
      },
    };
  }
}
