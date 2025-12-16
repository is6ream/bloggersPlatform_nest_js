import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentModelType } from '../domain/commentEntity';
import { GetCommentsQueryParams } from '../../posts/api/query/qet-comments-query-params';
import { CommentViewDto } from '../dto/commentViewDto';
import { PostRepository } from '../../posts/infrastructure/postRepository';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    private postsRepository: PostRepository,
  ) {}

  async getCommentByPostId(
    postId: string,
    query: GetCommentsQueryParams,
  ): Promise<CommentViewDto> {
    const skip = query.calculateSkip();

    await this.postsRepository.checkPostExist(postId);

    const filter: Record<string, any> = { postId };

    const [comments, totalCount] = await Promise.all([
      this.CommentModel.find(filter)
        .skip(skip)
        .limit(query.pageSize)
        .sort({ createdAt: query.sortDirection }),

      this.CommentModel.countDocuments(filter),
    ]);

    const result = CommentP
  }
}
ё;
