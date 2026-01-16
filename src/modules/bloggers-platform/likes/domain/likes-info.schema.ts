import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { NewestLikeSchema, NewestLike } from './newest-likes.schema';

@Schema({ _id: false })
export class LikesInfo {
  @Prop({ type: Number, required: true, default: 0 })
  likesCount: number;

  @Prop({ type: Number, required: true, default: 0 })
  dislikesCount: number;

  @Prop({ type: String, required: true, default: 'None' })
  status: string;

  @Prop({ type: NewestLikeSchema, required: true })
  newestLikes: NewestLike[];
}

export const LikesInfoSchema = SchemaFactory.createForClass(LikesInfo);
