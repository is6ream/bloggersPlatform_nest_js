import { BaseDBEntity } from 'src/core/database/base-db.entity';
import { Column, Entity } from 'typeorm';
import { randomUUID } from 'crypto';
import { CreateCommentDomainDto } from './types/create-comment.domain.dto';
import { CommentInputDto } from '../dto/comment-input.dto';

@Entity('comments')
export class CommentsOrmEntity extends BaseDBEntity {
  @Column({ type: 'varchar', length: 300 })
  content!: string;

  @Column({ type: 'varchar', name: 'commentatorUserId' })
  commentatorUserId!: string;

  @Column({ type: 'varchar', length: 255, name: 'commentatorUserLogin' })
  commentatorUserLogin!: string;

  @Column({ type: 'varchar', name: 'postId' })
  postId!: string;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  deleteAt!: Date | null;

  @Column({ type: 'int', default: 0, name: 'likesCount' })
  likesCount!: number;

  @Column({ type: 'int', default: 0, name: 'dislikesCount' })
  dislikesCount!: number;

  get commentatorInfo(): { userId: string; userLogin: string } {
    return {
      userId: this.commentatorUserId,
      userLogin: this.commentatorUserLogin,
    };
  }

  static create(dto: CreateCommentDomainDto): CommentsOrmEntity {
    const comment = new CommentsOrmEntity();

    comment.id = randomUUID();
    comment.content = dto.content;
    comment.commentatorUserId = dto.commentatorInfo.userId;
    comment.commentatorUserLogin = dto.commentatorInfo.userLogin;
    comment.postId = dto.postId;
    comment.deleteAt = null;
    comment.likesCount = 0;
    comment.dislikesCount = 0;

    return comment;
  }

  updateContent(dto: CommentInputDto): void {
    this.content = dto.content;
  }

  makeDeleted(): void {
    if (this.deleteAt !== null) {
      throw new Error('Comment already deleted');
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
