import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CommentatorInfo } from './schemas/commentatorInfoSchema';
import { LikesInfo } from './schemas/likesInfoSchema';
import { HydratedDocument, Model } from 'mongoose';
import { CreateCommentInputDto } from '../../posts/api/model/input/create-comment.input.dto';
import { CreateCommentDomainDto } from './types/create-comment.domain.dto';
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
  likesInfo: LikesInfo;

  static createInstance(dto: CreateCommentDomainDto) {
    const comment = new this();
    comment.content = dto.content;
    comment.commentatorInfo = dto.commentatorInfo;
    comment.createdAt = new Date();
    comment.likesInfo = { likesCount: 0, dislikesCount: 0, myStatus: 'None' };

    return comment as CommentDocument;
  }
}

export const CommentsSchema = SchemaFactory.createForClass(Comment);

CommentsSchema.loadClass(Comment);

export type CommentDocument = HydratedDocument<Comment>;

export type CommentModelType = Model<CommentDocument> & typeof Comment;
