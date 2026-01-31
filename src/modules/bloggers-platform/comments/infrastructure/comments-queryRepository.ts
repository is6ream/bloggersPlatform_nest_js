import { LikesRepository } from './../../likes/infrastructure/likes-repository';
import { Injectable } from '@nestjs/common';
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
import {
  Like,
  LikeDocument,
  LikeModelType,
} from '../../likes/domain/like-entity';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    @InjectModel(Like.name)
    private likeModel: LikeModelType,
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
    userId?: string, // Делаем необязательным
  ): Promise<PaginatedViewDto<CommentViewDto>> {
    console.log(userId, 'user id check in DAL');

    const skip = query.calculateSkip();

    await this.postsRepository.checkPostExist(postId);

    const filter: Record<string, any> = { postId };

    // 1. Получаем комментарии
    const comments = await this.CommentModel.find(filter)
      .skip(skip)
      .limit(query.pageSize)
      .sort({ createdAt: query.sortDirection })
      .lean()
      .exec();

    if (!comments.length) {
      return CommentPaginatedViewDto.mapToView({
        items: [],
        page: query.pageNumber,
        size: query.pageSize,
        totalCount: 0,
      });
    }

    const commentIds = comments.map((c) => c._id.toString());

    const likesAggregation = await this.getCommentsLikesAggregation(
      commentIds,
      userId,
    );

    const likesMap = likesAggregation.reduce((acc, item) => {
      acc[item.commentId] = {
        likesCount: item.likesCount || 0,
        dislikesCount: item.dislikesCount || 0,
        myStatus: userId ? item.userReaction || 'None' : 'None',
      };
      return acc;
    }, {});

    const totalCount = await this.CommentModel.countDocuments(filter);

    const items = comments.map((comment) => {
      const commentLikes = likesMap[comment._id.toString()] || {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
      };

      return {
        id: comment._id.toString(),
        content: comment.content,
        commentatorInfo: {
          userId: comment.commentatorInfo.userId,
          userLogin: comment.commentatorInfo.userLogin,
        },
        createdAt: comment.createdAt,
        likesInfo: {
          likesCount: commentLikes.likesCount,
          dislikesCount: commentLikes.dislikesCount,
          myStatus: commentLikes.myStatus,
        },
      };
    });

    return CommentPaginatedViewDto.mapToView({
      items,
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
    });
  }

  private async getCommentsLikesAggregation(
    commentIds: string[],
    userId?: string,
  ): Promise<any[]> {
    const pipeline: any[] = [
      {
        $match: {
          parentId: { $in: commentIds },
          parentType: 'Comment',
        },
      },
    ];

    if (userId) {
      pipeline.push(
        {
          $facet: {
            stats: [
              {
                $group: {
                  _id: '$parentId',
                  likesCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'Like'] }, 1, 0] },
                  },
                  dislikesCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'Dislike'] }, 1, 0] },
                  },
                },
              },
            ],
            userReaction: [
              {
                $match: {
                  userId: userId,
                },
              },
              {
                $group: {
                  _id: '$parentId',
                  userReaction: { $first: '$status' },
                },
              },
            ],
          },
        },
        {
          $project: {
            combined: {
              $concatArrays: ['$stats', '$userReaction'],
            },
          },
        },
        {
          $unwind: '$combined',
        },
        {
          $group: {
            _id: '$combined._id',
            data: { $mergeObjects: '$combined' },
          },
        },
        {
          $project: {
            commentId: '$_id',
            likesCount: { $ifNull: ['$data.likesCount', 0] },
            dislikesCount: { $ifNull: ['$data.dislikesCount', 0] },
            userReaction: { $ifNull: ['$data.userReaction', 'None'] },
          },
        },
      );
    } else {
      pipeline.push(
        {
          $group: {
            _id: '$parentId',
            likesCount: {
              $sum: { $cond: [{ $eq: ['$status', 'Like'] }, 1, 0] },
            },
            dislikesCount: {
              $sum: { $cond: [{ $eq: ['$status', 'Dislike'] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            commentId: '$_id',
            likesCount: 1,
            dislikesCount: 1,
            userReaction: 'None',
          },
        },
      );
    }

    return await this.likeModel.aggregate(pipeline).exec();
  }
}
