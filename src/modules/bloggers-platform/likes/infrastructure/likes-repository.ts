import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LikesOrmEntity } from '../domain/like.orm-entity';
import { LikeParentType } from '../types/like-parent-type';

@Injectable()
export class LikesRepository {
  constructor(
    @InjectRepository(LikesOrmEntity)
    private readonly repo: Repository<LikesOrmEntity>,
  ) {}

  async save(like: LikesOrmEntity): Promise<void> {
    await this.repo.save(like);
  }

  async findByUserAndParent(
    userId: string,
    parentId: string,
    parentType: LikeParentType,
  ): Promise<LikesOrmEntity | null> {
    return this.repo.findOne({
      where: { userId, parentId, parentType },
    });
  }

  async findByUserIdAndCommentdId(
    commentId: string,
    userId?: string,
  ): Promise<LikesOrmEntity | null> {
    if (!userId) {
      return null;
    }
    return this.findByUserAndParent(userId, commentId, 'Comment');
  }
}
