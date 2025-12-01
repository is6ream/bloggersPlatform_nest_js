import { Model, Schema, model, HydratedDocument } from 'mongoose';
import { randomUUID } from 'crypto';
import { UserDB } from './userDbEntity';

export type UserModel = Model<UserDB>;
export type UserDocument = HydratedDocument<UserDB>;

const userSchema = new Schema<UserDB, UserModel>({
  login: { type: String, required: true },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  emailConfirmation: {
    confirmationCode: { type: String, default: () => randomUUID() },
    expirationDate: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 60 * 1000),
    },
    isConfirmed: { type: Boolean, default: false },
  },
  passwordRecovery: {
    recoveryCode: String,
    passRecoveryExpDate: Date,
    isUsed: { type: Boolean, default: false },
  },
});
export const UserModel = model<UserDB, UserModel>('userModel', userSchema);
