import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { PostsOrmEntity } from './typeOrm/entity/post.orm-entity';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectRepository(PostsOrmEntity)
    private readonly repo: Repository<PostsOrmEntity>,
  ) {}

  private isValidPostId(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }
    if (/^[a-f\d]{24}$/i.test(id)) {
      return true;
    }
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    );
  }

  async findById(id: string): Promise<PostsOrmEntity | null> {
    return this.repo.findOne({ where: { id, deleteAt: IsNull() } });
  }

  async findByIdIncludingDeleted(id: string): Promise<PostsOrmEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async save(entity: PostsOrmEntity): Promise<void> {
    await this.repo.save(entity);
  }

  async findOrNotFoundFail(id: string): Promise<PostsOrmEntity> {
    const post = await this.findById(id);
    if (!post) {
      throw new DomainException({ code: 1, message: 'Post not found' });
    }
    return post;
  }

  async checkPostExist(id: string): Promise<void> {
    const post = await this.findById(id);
    if (!post) {
      throw new NotFoundException(`post with id: ${id} not found `);
    }
  }

  async findOrThrowValidationError(id: string): Promise<PostsOrmEntity> {
    if (!this.isValidPostId(id)) {
      throw new DomainException({
        code: 3,
        message: 'Invalid post id format',
        extensions: [
          {
            message: 'Invalid post id format',
            field: 'postId',
          },
        ],
      });
    }

    const post = await this.findById(id);
    if (!post) {
      throw new DomainException({
        code: 2,
        message: 'Post not found',
        extensions: [
          {
            message: 'Post with specified id not found',
            field: 'postId',
          },
        ],
      });
    }

    return post;
  }
}
