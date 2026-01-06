import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class PasswordRecovery {
  @Prop({ type: String, required: true })
  code: string;
  @Prop({ type: Boolean, required: true, default: false })
  isUsed: boolean;
  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const PasswordRecoverySchema =
  SchemaFactory.createForClass(PasswordRecovery);
