import { UserDbDto } from '../dto/userDbDto';
import { ObjectId, WithId } from 'mongodb';
import { UserDB } from '../entities/userDbEntity';
import { UserDocument } from '../entities/userMongoose';
import { Injectable } from '@nestjs/common';
import { UserModel } from '../entities/userMongoose';
import { UserOutput } from '../types/output/userOutputType';
import { HydratedDocument } from 'mongoose';
import { UserViewModel } from '../types/output/userViewModel';

//остановился  на настройке импортов в этом слое, продолжить рефакторинг

@Injectable()
export class UsersRepository {
  async create(newUser: UserDocument): Promise<string> {
    await newUser.save(); //почему он возвращает undefined?
    return newUser.id;
  }

  async find(id: string): Promise<UserViewModel> {
    const user = await UserModel.findOne({ _id: new ObjectId(id) });
    return {
      id: user!._id.toString(),
      login: user!.login,
      email: user!.email,
      createdAt: user!.createdAt,
    };
  }

  async delete(id: string): Promise<boolean> {
    const deleteResult = await UserModel.deleteOne({
      _id: new ObjectId(id),
    });
    return deleteResult.deletedCount === 1;
  }

  async isUserExistByEmailOrLogin(
    loginOrEmail: string,
  ): Promise<UserOutput | null> {
    const user: HydratedDocument<UserDB> | null = await UserModel.findOne({
      //
      $or: [{ email: loginOrEmail }, { login: loginOrEmail }],
    });
    if (!user) {
      return null;
    }
    return {
      id: user._id.toString(),
      login: user.login,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      emailConfirmation: {
        confirmationCode: user.emailConfirmation.confirmationCode!,
        expirationDate: user.emailConfirmation.expirationDate!,
        isConfirmed: user.emailConfirmation.isConfirmed,
      },
    };
  }

  async doesExistByLoginOrEmail(
    login: string,
    email: string,
  ): Promise<UserDB | undefined> {
    const existingByLogin = await UserModel.findOne({ login });
    if (existingByLogin) {
      return existingByLogin;
    }

    const existingByEmail = await UserModel.findOne({ email });
    if (existingByEmail) {
      return existingByEmail;
    }
    console.log(
      existingByLogin, //тут показывает null
      ' existingByLogin',
      existingByEmail, //и тут null
      ' existingByEmail',
    );
  }

  async findUserByConfirmationCode(code: string): Promise<UserDbDto | null> {
    const user: HydratedDocument<UserDB> | null = await UserModel.findOne({
      'emailConfirmation.confirmationCode': code,
    });
    if (!user) {
      return null;
    }

    if (
      !user.emailConfirmation?.confirmationCode ||
      !user.emailConfirmation?.expirationDate
    ) {
      return null;
    }
    return {
      id: user._id.toString(),
      login: user.login,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      emailConfirmation: {
        confirmationCode: user.emailConfirmation.confirmationCode,
        expirationDate: user.emailConfirmation.expirationDate,
        isConfirmed: user.emailConfirmation.isConfirmed,
      },
    };
  }

  async update(id: string): Promise<void> {
    const updateResult = await UserModel.updateOne(
      { _id: new ObjectId(id) },
      { $set: { 'emailConfirmation.isConfirmed': true } },
    );
    console.log(updateResult, 'updateResult check');
    return;
  }

  //у меня есть пасс и код, мне нужно по коду достать user, и обновить пароль
  async resetPassword(newHash: string, recoveryCode: string): Promise<void> {
    await UserModel.updateOne(
      {
        'passwordRecovery.recoveryCode': recoveryCode,
      },
      {
        $set: {
          passwordHash: newHash,
          'passwordRecovery.isUsed': true,
        },
      },
    );
    return;
  }

  async checkRecoveryCodeExpirationDate(code: string): Promise<Date | null> {
    const user: WithId<User> | null = await UserModel.findOne({
      'passwordRecovery.recoveryCode': code,
    });
    if (!user) {
      return null;
    }
    return user.passwordRecovery.passRecoveryExpDate;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({ email: email });
    if (!user) {
      return null;
    }
    return this.mapToUserDomain(user);
  }

  async updatePasswordRecovery(user: User): Promise<void> {
    await UserModel.updateOne(
      { email: user.email },
      {
        $set: { ...user },
      },
    );
    return;
  }

  private mapToUserDomain(userData: any): User {
    //функция маппер, которая приводит искомый объект к инстансу класса User для дальнейшей работы с методами
    const user = new User(
      userData.login,
      userData.email,
      userData.passwordHash,
    );

    user.createdAt = userData.createdAt;
    user.emailConfirmation = userData.emailConfirmation;
    user.passwordRecovery = userData.passwordRecovery;

    return user;
  }
}

export type PassRecoveryDtoType = {
  recoveryCode: string;
  expirationDate: Date;
  // isUsed: boolean; //стоит ли передавать это поле для обновления класса при отправке ссылки на восстановление пароля?
};
