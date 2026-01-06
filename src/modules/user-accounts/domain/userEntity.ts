import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  PasswordRecoverySchema,
  PasswordRecovery,
} from './schemas/passRecoverySchema';
import {
  EmailConfirmationSchema,
  EmailConfirmation,
} from './schemas/emailConfirmationSchema';
import { HydratedDocument, Model } from 'mongoose';
import { CreateUserDto, UpdateUserDto } from '../dto/UserInputDto';
import { randomUUID } from 'crypto';
@Schema({
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: false,
  },
})
export class User {
  @Prop({ type: String, required: true })
  login: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  passwordHash: string;

  @Prop({ type: EmailConfirmationSchema })
  emailConfirmation: EmailConfirmation;

  @Prop({ type: PasswordRecoverySchema })
  passwordRecovery: PasswordRecovery | null;

  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: Date, nullable: true, default: null })
  deleteAt: Date | null;

  static createInstance(dto: CreateUserDto): UserDocument {
    const user = new this();
    user.email = dto.email;
    user.passwordHash = dto.password;
    user.login = dto.login;

    user.emailConfirmation = {
      confirmationCode: randomUUID(),
      expirationDate: new Date(Date.now() + 3 * 60 * 1000),
      isConfirmed: false,
    };

    return user as UserDocument;
  }

  makeDeleted() {
    if (this.deleteAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deleteAt = new Date();
  }

  update(dto: UpdateUserDto) {
    if (dto.email !== this.email) {
      this.emailConfirmation.isConfirmed = false;
    }
    this.email = dto.email;
  }

  private generateRecoveryCode(): string {
    return randomUUID();
  }

  requestPasswordRecovery(): void {
    if (!this.emailConfirmation.isConfirmed) {
      throw new Error('Email must be confirmed');
    }

    const recoveryCode = this.generateRecoveryCode();

    this.passwordRecovery = {
      code: recoveryCode,
      expiresAt: new Date(Date.now() + 3600000), // 1 час
      isUsed: false,
    };
  }

  clearRecoveryCode(): void {
    this.passwordRecovery = null;
  }
}
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.loadClass(User);

export type UserDocument = HydratedDocument<User>;

export type UserModelType = Model<UserDocument> & typeof User;
