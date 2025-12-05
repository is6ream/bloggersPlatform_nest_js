import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PasswordRecoverySchema, PasswordRecovery } from './passRecoverySchema';
import {
  EmailConfirmationSchema,
  EmailConfirmation,
} from './emailConfirmationSchema';
import { HydratedDocument } from 'mongoose';
import { CreateUserDto } from '../dto/createUserInputDto';
import { Model } from 'mongoose';
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
  passwordRecovery: PasswordRecovery;

  @Prop({ type: Date, nullable: true })
  deleteAt: Date | null;

  static createInstance(dto: CreateUserDto): UserDocument {
    const user = new this();
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;
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
}
//Создаем схему на основе класса
export const UserSchema = SchemaFactory.createForClass(User);

//регистрируем методы сущности в схеме монгус
UserSchema.loadClass(User);

//типизируем документ
export type UserDocument = HydratedDocument<User>;

//Типизация модели + статические и инстанс методы
export type UserModelType = Model<UserDocument> & typeof User;
