import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../../domain/userEntity';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
export class AuthQueryRepository {
  constructor(@InjectModel(User.name) private UserModel: UserModelType) {}

  async getMe(id: string): Promise<User | null> {
    const user = await this.UserModel.findById(id);
    if (!user) {
      throw new DomainException({ code: 1, message: 'User not found' });
    }
    return user;
  }
}
