import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { BlogsOrmEntity } from '../domain/blog.orm-entity';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectRepository(BlogsOrmEntity)
    private readonly repo: Repository<BlogsOrmEntity>,
  ) {}

  private isValidBlogId(id: string): boolean {
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

  async findById(id: string): Promise<BlogsOrmEntity | null> {
    return this.repo.findOne({ where: { id, deleteAt: IsNull() } });
  }

  async save(entity: BlogsOrmEntity): Promise<void> {
    await this.repo.save(entity);
  }

  async findOrNotFoundFail(id: string): Promise<BlogsOrmEntity> {
    const blog = await this.findById(id);
    if (!blog) {
      throw new DomainException({ code: 1, message: 'Blog not found' });
    }
    return blog;
  }

  async findByIdOrThrowValidationError(id: string): Promise<BlogsOrmEntity> {
    if (!this.isValidBlogId(id)) {
      throw new DomainException({
        code: 3,
        message: 'Invalid blog id format',
        extensions: [
          {
            message: 'Invalid blog id format',
            field: 'blogId',
          },
        ],
      });
    }

    const blog = await this.findById(id);
    if (!blog) {
      throw new DomainException({
        code: 2,
        message: 'Blog not found',
        extensions: [
          {
            message: 'Blog with specified id not found',
            field: 'blogId',
          },
        ],
      });
    }

    return blog;
  }

  async checkBlogExist(id: string): Promise<void> {
    await this.findOrNotFoundFail(id);
  }
}
