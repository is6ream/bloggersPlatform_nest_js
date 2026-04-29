import { UserDocument } from 'src/modules/user-accounts/domain/userEntity';
import { UserSqlEntity } from 'src/modules/user-accounts/domain/user-sql.entity';
import { UserOrmEntity } from 'src/modules/user-accounts/infrastructure/users/entities/user.orm-entity';

export class UserViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: Date;

  static mapToView(user: UserDocument | UserSqlEntity): UserViewDto {
    const dto = new UserViewDto();

    dto.email = user.email;
    dto.login = user.login;
    dto.id = user instanceof UserSqlEntity ? user.id : user._id.toString();
    dto.createdAt = user.createdAt;

    return dto;
  }

  static fromOrm(user: UserOrmEntity): UserViewDto {
    const dto = new UserViewDto();
    dto.id = user.id;
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt;
    return dto;
  }
}
