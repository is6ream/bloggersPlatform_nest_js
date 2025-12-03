import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class PasswordRecovery {
  @Prop({ type: Boolean, required: true, default: false })
  isUsed: boolean;
}

export const PasswordRecoverySchema =
  SchemaFactory.createForClass(PasswordRecovery);
