import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CommentatorInfo } from './schemas/commentatorInfoSchema';
import { HydratedDocument, Model } from 'mongoose';
import { CreateCommentDomainDto } from './types/create-comment.domain.dto';
import { LikesInfo } from '../../likes/domain/likes-info.schema';
@Schema({
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: false,
  },
})
export class Comment {
  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: CommentatorInfo, required: true })
  commentatorInfo: CommentatorInfo;

  @Prop({ type: Date, nullable: true, default: null })
  deleteAt: Date;

  createdAt: Date;

  @Prop({ type: String, required: true })
  postId: string;

  @Prop({ type: LikesInfo, required: true })
  likesInfo: LikesInfo;

  static createInstance(this: CommentModelType, dto: CreateCommentDomainDto) {
    const comment = new this();
    comment.content = dto.content;
    comment.commentatorInfo = dto.commentatorInfo;
    comment.createdAt = new Date();
    comment.likesInfo = {
      likesCount: 0,
      dislikesCount: 0,
    };
    return comment as CommentDocument;
  }

  makeDeleted() {
    if (this.deleteAt !== null) {
      throw new Error('Comment already deleted');
    }
    this.deleteAt = new Date();
  }

  updateLikeCounter(oldLikeStatus: string, newLikeStatus: string) {
    if (oldLikeStatus === 'Like' && newLikeStatus === 'Dislike') {
      this.likesInfo.likesCount--;
      this.likesInfo.dislikesCount++;
    }
    if (oldLikeStatus === 'Like' && newLikeStatus === 'None') {
      this.likesInfo.likesCount--;
    }
    if (oldLikeStatus === 'Dislike' && newLikeStatus === 'Like') {
      this.likesInfo.likesCount++;
      this.likesInfo.dislikesCount--;
    }
    if (oldLikeStatus === 'Dislike' && newLikeStatus === 'None') {
      this.likesInfo.dislikesCount--;
    }
    if (oldLikeStatus === 'None' && newLikeStatus === 'Like') {
      this.likesInfo.likesCount++;
    }
    if (oldLikeStatus === 'None' && newLikeStatus === 'Dislike') {
      this.likesInfo.dislikesCount++;
    }
  }
}

export const CommentsSchema = SchemaFactory.createForClass(Comment);

CommentsSchema.loadClass(Comment);

export type CommentDocument = HydratedDocument<Comment>;

export type CommentModelType = Model<CommentDocument> & typeof Comment;
