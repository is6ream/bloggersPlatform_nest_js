import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

@Schema({
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'lastActiveAt',
  },
})
export class DeviceSession {
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  deviceId: string;

  @Prop({ type: String })
  ip: string;

  @Prop({ type: String })
  userAgent: string;

  @Prop({ type: String, required: true })
  refreshTokenHash: string;

  @Prop({ type: Date, required: false })
  expiresAt?: Date;
}

export type DeviceSessionDocument = HydratedDocument<DeviceSession>;
export type DeviceSessionModelType = Model<DeviceSessionDocument>;

export const DeviceSessionSchema = SchemaFactory.createForClass(DeviceSession);