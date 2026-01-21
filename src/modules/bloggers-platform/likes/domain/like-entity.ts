import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { LikeStatus } from '../types/like-status';
import { HydratedDocument, Model } from 'mongoose';
import { CreateLikeDto } from '../types/input/create-like.dto';

@Schema({
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: false,
  },
})
export class Like {
  @Prop({ type: String, enum: Object.values(LikeStatus), required: true })
  status: string;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  parentId: string;

  @Prop({ type: String, required: true })
  parentType: string;

  createdAt: Date;

  static createInstance(dto: CreateLikeDto): LikeDocument {
    const like = new this();
    like.status = dto.likeStatus;
    like.userId = dto.userId;
    like.parentId = dto.parentId;
    like.parentType = 'Post';
    return like as LikeDocument;
  }
}

export const LikeSchema = SchemaFactory.createForClass(Like);

LikeSchema.loadClass(Like);

export type LikeDocument = HydratedDocument<Like>;

export type LikeModelType = Model<LikeDocument> & typeof Like;
