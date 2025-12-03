import { Prop, Schema } from '@nestjs/mongoose';
import { PasswordRecoverySchema, PasswordRecovery } from './passRecoverySchema';
import {
  EmailConfirmationSchema,
  EmailConfirmation,
} from './emailConfirmationSchema';
import { HydratedDocument } from 'mongoose';
import { CreateUserDomainDto } from '../dto/createUserInputDto';
export type UserDocument = HydratedDocument<User>;

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
  passwordRecovery: PasswordRecovery;

  @Prop({ type: Date, nullable: true })
  deleteAt: Date | null;

  static createInstance(dto: CreateUserDomainDto): UserDocument {
    const user = new this();
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;
    user.login = dto.login;
    user.emailConfirmation.isConfirmed = false;

    return user as UserDocument;
  }

  makeDeleted() {
    if (this.deleteAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deleteAt = new Date();
  }
}
