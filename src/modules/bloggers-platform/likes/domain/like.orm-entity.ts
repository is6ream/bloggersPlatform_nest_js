import { BaseDBEntity } from 'src/core/database/base-db.entity';
import { Column, Entity } from 'typeorm';
import { randomUUID } from 'crypto';
import { CreateLikeDto } from '../types/input/create-like.dto';
import { LikeParentType } from '../types/like-parent-type';
import { LikeStatus } from '../types/like-status';

@Entity('likes')
export class LikesOrmEntity extends BaseDBEntity {
  @Column({ type: 'varchar', length: 10 })
  status!: LikeStatus;

  @Column({ type: 'uuid', name: 'userId' })
  userId!: string;

  @Column({ type: 'uuid', name: 'parentId' })
  parentId!: string;

  @Column({ type: 'varchar', length: 20, name: 'parentType' })
  parentType!: LikeParentType;

  static create(dto: CreateLikeDto): LikesOrmEntity {
    const like = new LikesOrmEntity();

    like.id = randomUUID();
    like.status = dto.status;
    like.userId = dto.userId;
    like.parentId = dto.parentId;
    like.parentType = dto.parentType;

    return like;
  }

  static createForPost(
    userId: string,
    postId: string,
    status: LikeStatus,
  ): LikesOrmEntity {
    return LikesOrmEntity.create({
      userId,
      parentId: postId,
      parentType: 'Post',
      status,
    });
  }

  static createForComment(
    userId: string,
    commentId: string,
    status: LikeStatus,
  ): LikesOrmEntity {
    return LikesOrmEntity.create({
      userId,
      parentId: commentId,
      parentType: 'Comment',
      status,
    });
  }

  hasStatus(status: LikeStatus): boolean {
    return this.status === status;
  }

  updateStatus(status: LikeStatus): void {
    this.status = status;
    this.createdAt = new Date();
  }
}
