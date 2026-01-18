import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../domain/commentEntity';
import { PostRepository } from '../../posts/infrastructure/postRepository';
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    private postRepository: PostRepository,
  ) {}

  async save(comment: CommentDocument) {
    await comment.save();
  }
}
