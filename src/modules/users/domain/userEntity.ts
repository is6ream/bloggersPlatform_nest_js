import { Prop, Schema } from '@nestjs/mongoose';
import { PasswordRecoverySchema, PasswordRecovery } from './passRecoverySchema';
import {
  EmailConfirmationSchema,
  EmailConfirmation,
} from './emailConfirmationSchema';

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
}
