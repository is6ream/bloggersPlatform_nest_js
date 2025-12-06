import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/userEntity';
import { UserViewDto } from '../api/user.view-dto';
import { NotFoundException } from '@nestjs/common';

export class UsersQueryRepository {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<UserViewDto> {
    const user: UserDocument | null = await this.UserModel.findOne({
      _id: id,
      deleteAt: null,
    });

    if (!user) {
      throw new NotFoundException('user not found!');
    }

    return UserViewDto.mapToView(user);
  }
}
