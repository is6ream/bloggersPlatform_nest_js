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
//как создать тип UserDocument?
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

  static createInstance(dto: CreateUserDomainDto): UserDocument {
    const user = new this();
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;
    user.login = dto.login;
    user.emailConfirmation.isConfirmed = false;

    return user as UserDocument;
  }
}
