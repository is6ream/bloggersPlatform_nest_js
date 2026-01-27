import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../domain/commentEntity';
import { PostRepository } from '../../posts/infrastructure/postRepository';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { LikeDocument } from '../../likes/domain/like-entity';
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    private postRepository: PostRepository,
  ) {}

  async save(comment: CommentDocument) {
    await comment.save();
  }

  async findOrNotFoundFail(id: string): Promise<CommentDocument> {
    const comment: CommentDocument | null =
      await this.CommentModel.findById(id);
    if (!comment) {
      throw new DomainException({ code: 1, message: 'Comment not found' });
    }
    return comment;
  }

  async likeStatusSave(like: LikeDocument): Promise<void> {
    console.log('like status save method check');
    await like.save();
  }
}
