import { UserQueryInput } from '../input/user-query.input';
import { CurrentUser, UserViewModel } from '../types/user-types';
import { ObjectId } from 'mongodb';
import { injectable } from 'inversify';
import { UserModel } from '../types/usersMongoose';

@injectable()
export class UsersQueryRepository {
  async findAll(
    queryDto: UserQueryInput,
  ): Promise<{ items: UserViewModel[]; totalCount: number }> {
    const {
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      searchLoginTerm,
      searchEmailTerm,
    } = queryDto;

    const skip = (pageNumber - 1) * pageSize;
    const filter: any = {};

    if (searchLoginTerm || searchEmailTerm) {
      filter.$or = [];
      if (searchLoginTerm) {
        filter.$or.push({ login: { $regex: searchLoginTerm, $options: 'i' } });
      }
      if (searchEmailTerm) {
        filter.$or.push({
          email: { $regex: searchEmailTerm, $options: 'i' },
        });
      }
    }

    const dbItems = await UserModel.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(+pageSize)
      .lean();

    const totalCount = await UserModel.countDocuments(filter);

    const items = dbItems.map((item) => {
      return {
        id: item._id.toString(),
        login: item.login,
        email: item.email,
        createdAt: item.createdAt,
      };
    });
    return { items, totalCount };
  }

  async findById(id: string): Promise<CurrentUser | null> {
    const user = await UserModel.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return null;
    }
    return {
      email: user.email,
      login: user.login,
      userId: user._id.toString(),
    };
  }
}
