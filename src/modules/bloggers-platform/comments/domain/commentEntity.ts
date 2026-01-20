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

  @Prop({ type: LikesInfo, required: true })
  extendedLikesInfo: LikesInfo;

  static createInstance(this: CommentModelType, dto: CreateCommentDomainDto) {
    const comment = new this();
    comment.content = dto.content;
    comment.commentatorInfo = dto.commentatorInfo;
    comment.createdAt = new Date();
    comment.extendedLikesInfo = {
      likesCount: 0,
      dislikesCount: 0,
      status: 'None',
    };

    return comment as CommentDocument;
  }

  updateLikeCounter(oldLikeStatus: string, newLikeStatus: string) {
    if (oldLikeStatus === 'Like' && newLikeStatus === 'Dislike') {
      this.extendedLikesInfo.likesCount--;
      this.extendedLikesInfo.dislikesCount++;
    }
    if (oldLikeStatus === 'Like' && newLikeStatus === 'None') {
      this.extendedLikesInfo.likesCount--;
    }
    if (oldLikeStatus === 'Dislike' && newLikeStatus === 'Like') {
      this.extendedLikesInfo.likesCount++;
      this.extendedLikesInfo.dislikesCount--;
    }
    if (oldLikeStatus === 'Dislike' && newLikeStatus === 'None') {
      this.extendedLikesInfo.dislikesCount--;
    }
    if (oldLikeStatus === 'None' && newLikeStatus === 'Like') {
      this.extendedLikesInfo.likesCount++;
    }
    if (oldLikeStatus === 'None' && newLikeStatus === 'Dislike') {
      this.extendedLikesInfo.dislikesCount++;
    }
  }
}

export const CommentsSchema = SchemaFactory.createForClass(Comment);

CommentsSchema.loadClass(Comment);

export type CommentDocument = HydratedDocument<Comment>;

export type CommentModelType = Model<CommentDocument> & typeof Comment;
