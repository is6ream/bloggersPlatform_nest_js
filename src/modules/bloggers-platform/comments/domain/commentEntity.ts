import { Prop, Schema } from '@nestjs/mongoose';

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
}
