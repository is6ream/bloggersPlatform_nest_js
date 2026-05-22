import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { GetCommentsQueryParams } from '../../posts/api/query/qet-comments-query-params';
import { CommentPaginatedViewDto } from '../../posts/api/paginated/paginated.comment.view-dto';
import { PostsRepository } from '../../posts/infrastructure/postsRepository';
import { LikesRepository } from '../../likes/infrastructure/likes-repository';
import { CommentsOrmEntity } from '../domain/comment.orm-entity';
import { CommentViewDto } from '../dto/commentViewDto';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectRepository(CommentsOrmEntity)
    private readonly repo: Repository<CommentsOrmEntity>,
    private readonly postsRepository: PostsRepository,
    private readonly likesRepository: LikesRepository,
  ) {}

  async findById(id: string): Promise<CommentsOrmEntity | null> {
    return this.repo.findOne({ where: { id, deleteAt: IsNull() } });
  }

  async getByIdOrNotFoundFail(
    commentId: string,
    currentUserId?: string,
  ): Promise<CommentViewDto> {
    const comment = await this.findById(commentId);

    if (!comment) {
      throw new DomainException({ code: 1, message: 'Comment not found' });
    }

    const like = await this.likesRepository.findByUserIdAndCommentdId(
      commentId,
      currentUserId,
    );

    return CommentViewDto.mapToView(comment, like);
  }

  async getCommentByPostId(
    postId: string,
    query: GetCommentsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<CommentViewDto>> {
    await this.postsRepository.findOrNotFoundFail(postId);

    const sortDirection = query.sortDirection.toUpperCase() as 'ASC' | 'DESC';

    const [comments, totalCount] = await this.repo
      .createQueryBuilder('c')
      .where('c.postId = :postId', { postId })
      .andWhere('c.deleteAt IS NULL')
      .orderBy('c.createdAt', sortDirection)
      .skip(query.calculateSkip())
      .take(query.pageSize)
      .getManyAndCount();

    if (!comments.length) {
      return CommentPaginatedViewDto.mapToView({
        items: [],
        page: query.pageNumber,
        size: query.pageSize,
        totalCount: 0,
      });
    }

    const items = await Promise.all(
      comments.map(async (comment) => {
        const like = userId
          ? await this.likesRepository.findByUserIdAndCommentdId(
              comment.id,
              userId,
            )
          : null;

        return CommentViewDto.mapToView(comment, like);
      }),
    );

    return CommentPaginatedViewDto.mapToView({
      items,
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
    });
  }
}
