import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../domain/commentEntity';
import { GetCommentsQueryParams } from '../../posts/api/query/qet-comments-query-params';
import { CommentViewDto } from '../dto/commentViewDto';
import { PostRepository } from '../../posts/infrastructure/postRepository';
import { CommentPaginatedViewDto } from '../../posts/api/paginated/paginated.comment.view-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    private postsRepository: PostRepository,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<CommentViewDto> {
    const comment: CommentDocument | null = await this.CommentModel.findOne({
      _id: id,
      deleteAt: null,
    });

    console.log(comment, 'comment check in comments query repository');

    if (!comment) {
      throw new NotFoundException('comment not found');
    }
    return CommentViewDto.mapToView(comment);
  }

  async getCommentByPostId(
    postId: string,
    query: GetCommentsQueryParams,
  ): Promise<PaginatedViewDto<CommentViewDto>> {
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

    const result: PaginatedViewDto<CommentViewDto> =
      CommentPaginatedViewDto.mapToView({
        items: comments.map((c) => CommentViewDto.mapToView(c)),
        page: query.pageNumber,
        size: query.pageSize,
        totalCount: totalCount,
      });

    return result;
  }
}
