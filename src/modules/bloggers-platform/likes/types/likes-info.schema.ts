import { Schema, Prop } from '@nestjs/mongoose';

@Schema({ _id: false })
export class LikesInfo {
  @Prop({ type: Number, required: true, default: 0 })
  likesCount: number;

  @Prop({ type: Number, required: true, default: 0 })
  dislikesCount: number;

  @Prop({ type: String, required: true, default: 'None' })
  status: string;
}
