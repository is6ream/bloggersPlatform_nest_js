import { Prop, Schema } from '@nestjs/mongoose';
import { CommentatorInfo } from './schemas/commentatorInfoSchema';

@Schema({
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: false,
  },
})
//начал описывать доменную модель комментария
export class Comment {
  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: CommentatorInfo, required: true })
  commentatorInfo: CommentatorInfo;

  @Prop({ type: Date, nullable: true, default: null })
  createdAt: Date;

  @Prop
}
