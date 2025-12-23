import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CommentatorInfo } from './schemas/commentatorInfoSchema';
import { LikesInfo } from './schemas/likesInfoSchema';
import { HydratedDocument, Model } from 'mongoose';

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
}

export const CommentsSchema = SchemaFactory.createForClass(Comment);

CommentsSchema.loadClass(Comment);

export type CommentDocument = HydratedDocument<Comment>;

export type CommentModelType = Model<CommentDocument> & typeof Comment;
