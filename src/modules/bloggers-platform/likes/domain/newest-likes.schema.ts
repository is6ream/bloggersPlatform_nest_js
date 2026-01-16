import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class NewestLike {
  @Prop({ type: Date, required: true })
  addedAt: Date;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  login: string;
}

export const NewestLikeSchema = SchemaFactory.createForClass(NewestLike);
export type NewestLikeDocument = HydratedDocument<NewestLike>;
