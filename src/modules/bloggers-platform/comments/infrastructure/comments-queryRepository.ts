import { LikesRepository } from './../../likes/infrastructure/likes-repository';
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
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { LikeDocument } from '../../likes/domain/like-entity';
import { BlogDocument } from 'src/modules/bloggers-platform/blogs/domain/blogEntity';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    private postsRepository: PostRepository,
    private likesRepository: LikesRepository,
  ) {}

  async findById(id: string): Promise<CommentDocument | null> {
    return this.CommentModel.findOne({
      _id: id,
      deleteAt: null,
    });
  }

  async getByIdOrNotFoundFail(
    commentId: string,
    currentUserId?: string,
  ): Promise<CommentViewDto> {
    const comment = await this.findById(commentId);

    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
      });
    }

    const like: LikeDocument | null =
      await this.likesRepository.findByUserIdAndCommentdId(
        commentId,
        currentUserId,
      );

    if (!like) {
      return {
        id: comment._id.toString(),
        content: comment.content,
        commentatorInfo: comment.commentatorInfo,
        createdAt: comment.createdAt,
        likesInfo: {
          likesCount: comment.likesInfo.likesCount,
          dislikesCount: comment.likesInfo.dislikesCount,
          myStatus: 'None',
        },
      };
    }

    return {
      id: comment._id.toString(),
      content: comment.content,
      commentatorInfo: comment.commentatorInfo,
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: comment.likesInfo.likesCount,
        dislikesCount: comment.likesInfo.dislikesCount,
        myStatus: like.status,
      },
    };
  }

  async getCommentByPostId(
    postId: string,
    query: GetCommentsQueryParams,
    userId: string | undefined,
  ): Promise<PaginatedViewDto<CommentViewDto>> {
    const skip = query.calculateSkip();

    await this.postsRepository.checkPostExist(postId);
    const like = await this;

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
