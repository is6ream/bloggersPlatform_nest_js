import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { NewestLike } from './newest-likes.schema';

@Schema({ _id: false })
export class LikesInfo {
  @Prop({ type: Number, required: true, default: 0 })
  likesCount: number;

  @Prop({ type: Number, required: true, default: 0 })
  dislikesCount: number;

  @Prop({ type: String, required: true, default: 'None' })
  status: string;
}

export const LikesInfoSchema = SchemaFactory.createForClass(LikesInfo);
