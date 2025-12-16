import { Prop, Schema } from '@nestjs/mongoose';
import { CommentatorInfo } from './schemas/commentatorInfoSchema';
import { LikesInfo } from './schemas/likesInfoSchema';

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
