import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/userEntity';
import { UserViewDto } from '../api/user.view-dto';
import { NotFoundException, Injectable } from '@nestjs/common';
import { GetUsersQueryParams } from '../api/get-users-query-params.input.dto';
import { UserPaginatedViewDto } from '../api/paginatied.user.view-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';

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

  async getAll(
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto>> {
    const skip = query.calculateSkip();

    const filter: Record<string, any> = {
      deleteAt: null,
    };

    const orConditions = [];

    if (query.searchEmailTerm) {
      orConditions.push({
        email: { $regex: query.searchEmailTerm, $options: 'i' },
      });
    }

    if (query.searchLoginTerm) {
      orConditions.push({
        login: { $regex: query.searchLoginTerm, $options: 'i' },
      });
    }

    if (orConditions.length > 0) {
      filter.$or = orConditions;
    }

    console.log(filter, 'users filter check');

    const [users, totalCount] = await Promise.all([
      this.UserModel.find(filter)
        .skip(skip)
        .limit(query.pageSize)
        .sort({ [query.sortBy]: query.sortDirection }),

      this.UserModel.countDocuments(filter),
    ]);

    const result = UserPaginatedViewDto.mapToView({
      items: users.map((u) => UserViewDto.mapToView(u)),
      page: query.pageNumber,
      size: query.pageSize,
      totalCount: totalCount,
    });

    return result;
  }
}
