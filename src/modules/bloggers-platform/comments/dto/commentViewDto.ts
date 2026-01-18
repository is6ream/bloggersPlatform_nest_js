import { CommentViewModel } from '../../posts/api/model/output/commentViewModel';
import { CommentDocument } from '../domain/commentEntity';

export class CommentViewDto extends CommentViewModel {
  static mapToView(comment: CommentDocument): CommentViewDto {
    const dto = new this();

    dto.id = comment._id.toString();
    dto.content = comment.content;
    dto.commentatorInfo.userId = comment.commentatorInfo.userId;
    dto.commentatorInfo.userLogin = comment.commentatorInfo.userLogin;
    dto.createdAt = comment.createdAt;
    dto.likesInfo.likesCount = comment.likesInfo.likesCount;
    dto.likesInfo.dislikesCount = comment.likesInfo.dislikesCount;
    dto.likesInfo.myStatus = comment.likesInfo.myStatus;

    return dto;
  }
}
