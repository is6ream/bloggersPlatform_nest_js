import { CommentViewModel } from '../../posts/api/model/output/commentViewModel';
import { CommentDocument } from '../domain/commentEntity';

export class CommentViewDto extends CommentViewModel {
  static mapToView(comment: CommentDocument): CommentViewDto {
    const dto = {
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
        myStatus: comment.likesInfo.status,
      },
    };

    return dto as CommentViewDto;
  }
}
