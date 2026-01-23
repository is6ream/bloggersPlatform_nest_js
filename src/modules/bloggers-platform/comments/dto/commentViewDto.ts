import { LikeDocument } from '../../likes/domain/like-entity';
import { CommentViewModel } from '../../posts/api/model/output/commentViewModel';
import { CommentDocument } from '../domain/commentEntity';

export class CommentViewDto extends CommentViewModel {
  static mapToView(
    comment: CommentDocument,
    like?: LikeDocument | null,
  ): CommentViewDto {
    let dto;

    if (like) {
      dto = {
        id: comment._id.toString(),
        content: comment.content,
        commentatorInfo: {
          userId: comment.commentatorInfo.userId,
          userLogin: comment.commentatorInfo.userLogin,
        },
        createdAt: comment.createdAt,
        likesInfo: {
          likesCount: comment.likesInfo.likesCount,
          dislikesCount: comment.likesInfo.dislikesCount,
          myStatus: like.status,
        },
      };
    }

    dto = {
      id: comment._id.toString(),
      content: comment.content,
      commentatorInfo: {
        userId: comment.commentatorInfo.userId,
        userLogin: comment.commentatorInfo.userLogin,
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: comment.likesInfo.likesCount,
        dislikesCount: comment.likesInfo.dislikesCount,
        myStatus: 'None',
      },
    };

    return dto as CommentViewDto;
  }
}
