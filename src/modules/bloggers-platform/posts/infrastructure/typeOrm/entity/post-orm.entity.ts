import { BaseDBEntity } from 'src/core/database/base-db.entity';
import { Column, Entity } from 'typeorm';
import { randomUUID } from 'crypto';
import { CreatePostDomainDto } from '../../../application/types/create-post-domain.dto';
import { UpdatePostDto } from '../../../domain/dto/input/updatePostDto';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';

@Entity('posts')
export class PostOrmEntity extends BaseDBEntity {
  @Column({ type: 'varchar', length: 30 })
  title!: string;

  @Column({ type: 'varchar', length: 100, name: 'shortDescription' })
  shortDescription!: string;

  @Column({ type: 'varchar', length: 1000 })
  content!: string;

  @Column({ type: 'varchar', name: 'blogId' })
  blogId!: string;

  @Column({ type: 'varchar', length: 15, name: 'blogName' })
  blogName!: string;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  deleteAt!: Date | null;

  @Column({ type: 'int', default: 0, name: 'likesCount' })
  likesCount!: number;

  @Column({ type: 'int', default: 0, name: 'dislikesCount' })
  dislikesCount!: number;

  static create(dto: CreatePostDomainDto): PostOrmEntity {
    const post = new PostOrmEntity();

    post.id = randomUUID();
    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;
    post.blogId = dto.blogId;
    post.blogName = dto.blogName;
    post.deleteAt = null;
    post.likesCount = 0;
    post.dislikesCount = 0;

    return post;
  }

  updatePost(dto: UpdatePostDto): void {
    this.title = dto.title;
    this.shortDescription = dto.shortDescription;
    this.content = dto.content;
  }

  makeDeleted(): void {
    if (this.deleteAt !== null) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }
    this.deleteAt = new Date();
  }

  updateLikeCounter(oldLikeStatus: string, newLikeStatus: string): void {
    if (oldLikeStatus === 'Like' && newLikeStatus === 'Dislike') {
      this.likesCount--;
      this.dislikesCount++;
    }
    if (oldLikeStatus === 'Like' && newLikeStatus === 'None') {
      this.likesCount--;
    }
    if (oldLikeStatus === 'Dislike' && newLikeStatus === 'Like') {
      this.likesCount++;
      this.dislikesCount--;
    }
    if (oldLikeStatus === 'Dislike' && newLikeStatus === 'None') {
      this.dislikesCount--;
    }
    if (oldLikeStatus === 'None' && newLikeStatus === 'Like') {
      this.likesCount++;
    }
    if (oldLikeStatus === 'None' && newLikeStatus === 'Dislike') {
      this.dislikesCount++;
    }
  }
}
