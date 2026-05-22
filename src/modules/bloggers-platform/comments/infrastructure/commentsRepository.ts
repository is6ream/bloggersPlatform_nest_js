import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { CommentsOrmEntity } from '../domain/comment.orm-entity';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectRepository(CommentsOrmEntity)
    private readonly repo: Repository<CommentsOrmEntity>,
  ) {}

  async findById(id: string): Promise<CommentsOrmEntity | null> {
    return this.repo.findOne({ where: { id, deleteAt: IsNull() } });
  }

  async findOrNotFoundFail(id: string): Promise<CommentsOrmEntity> {
    const comment = await this.findById(id);
    if (!comment) {
      throw new DomainException({ code: 1, message: 'Comment not found' });
    }
    return comment;
  }

  async save(entity: CommentsOrmEntity): Promise<void> {
    await this.repo.save(entity);
  }
}
