import { CreateCommentUseCase } from './create-comment.usecase';
import { UpdateCommentLikeStatusUseCase } from './update-like-status.usecase';

export const commentsCommandHadnler = [
  CreateCommentUseCase,
  UpdateCommentLikeStatusUseCase,
];
