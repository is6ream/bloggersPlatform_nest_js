import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { LikeStatus } from '../types/like-status';
import { CreateLikeForPostDto } from '../types/create-like.forPost.dto';
import { HydratedDocument , Model} from 'mongoose';
export class Like {
  @Prop({ type: String, enum: Object.values(LikeStatus), required: true })
  likeStatus: string;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  parentId: string;

  @Prop({ type: String, required: true })
  parentType: string;

  @Prop({ type: Date, required: true })
  createdAt: Date;

  static createInstance(dto: CreateLikeForPostDto) {
    const like = new this();
    like.likeStatus = dto.likeStatus;
    like.userId = dto.userId;
    like.parentId = dto.postId;
    like.parentType = 'Post';
    return like;
  }
}

export const LikeSchema = SchemaFactory.createForClass(Like);

LikeSchema.loadClass(Like);

export type LikeDocument = HydratedDocument<Like>;

export type LikeModelType = Model<LikeDocument> & typeof Like;
