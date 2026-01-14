import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../../domain/userEntity';
import { UserDocument } from '../../domain/userEntity';
import { LoginOrEmailDto } from '../dto/login-or-email.dto';
import { DomainException } from 'src/core/exceptions/domain-exceptions';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private UserModel: UserModelType) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      _id: id,
      deleteAt: null,
    });
  }

  async save(user: UserDocument) {
    await user.save();
  }

  async findOrNotFoundFail(id: string): Promise<UserDocument> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user;
  }

  async findByIdOrThrowValidationError(id: string): Promise<UserDocument> {
    const user = await this.findById(id);
    if (!user) {
      throw new DomainException({ code: 2, message: 'User not found', extensions: [{ message: 'User not found', field: 'userId' }] });
    }
    return user;
  }

  async findByLogin(login: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      login,
      deleteAt: null,
    });
  }

  async findUserByLoginOrEmail(
    loginOrEmail: LoginOrEmailDto,
  ): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      $or: [{ login: loginOrEmail.login }, { email: loginOrEmail.email }],
      deleteAt: null,
    });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      email,
    });
  }

  async findByRecoveryCode(code: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      'passwordRecovery.code': code,
    });
  }

  async findByConfirmationCode(code: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      'emailConfirmation.confirmationCode': code,
    });
  }
}
