import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/userEntity';
import { UserViewDto } from '../api/user.view-dto';
import { NotFoundException, Injectable } from '@nestjs/common';
import { GetUsersQueryParams } from '../api/get-users-query-params.input.dto';

@Injectable()
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

  async getAll(query: GetUsersQueryParams): Promise<UserViewDto[]> {
    const skip = query.calculateSkip();

    const filter: Record<string, any> = {};

    if (query.searchEmailTerm) {
      filter['login'] = { $regex: query.searchEmailTerm, $options: 'i' };
    }

    if (query.searchLoginTerm) {
      filter['email'] = { $regex: query.searchLoginTerm, $options: 'i' };
    }

    const [users, totalCount] = await Promise.all([
      //возвращаются users по заданным критериям и общее количество документов
      this.UserModel.find(filter)
        .skip(skip)
        .limit(query.pageSize)
        .sort({ createdAt: query.sortDirection }),

      this.UserModel.countDocuments(filter),
    ]);

    return users.map((u) => UserViewDto.mapToView(u));
  }
}
