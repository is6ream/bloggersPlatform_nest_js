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
    console.log('DAL check');
    console.log(comment, 'comment check');
    console.log(typeof comment); // должно быть 'object'
    console.log(comment.constructor.name); // должно быть 'model' или 'Document'F
    await comment.save();
  }
}
