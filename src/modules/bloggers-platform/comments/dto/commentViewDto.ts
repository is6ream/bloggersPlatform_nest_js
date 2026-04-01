import { LikeSqlEntity } from '../../likes/domain/like-entity';
import { CommentViewModel } from '../../posts/api/model/output/commentViewModel';
import { CommentSqlEntity } from '../domain/commentEntity';

export class CommentViewDto extends CommentViewModel {
  static mapToView(
    comment: CommentSqlEntity,
    like?: LikeSqlEntity | null,
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
        likesCount: comment.likesInfo.likesCount,
        dislikesCount: comment.likesInfo.dislikesCount,
        myStatus: like?.status ?? 'None',
      },
    };
  }
}
