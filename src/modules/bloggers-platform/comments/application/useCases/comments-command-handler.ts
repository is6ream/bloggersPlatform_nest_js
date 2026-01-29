import { CreateCommentUseCase } from './create-comment.usecase';
import { UpdateCommentLikeStatusUseCase } from './update-like-status.usecase';
import {
  UpdateCommentUseCase
} from 'src/modules/bloggers-platform/comments/application/useCases/update-comment.usecase';
import {
  DeleteCommentUseCase
} from 'src/modules/bloggers-platform/comments/application/useCases/delete-comment.usecase';

export const commentsCommandHadnler = [
  CreateCommentUseCase,
  UpdateCommentLikeStatusUseCase,
  UpdateCommentUseCase,
  DeleteCommentUseCase
];
