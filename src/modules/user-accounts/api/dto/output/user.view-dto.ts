import { UserDocument } from 'src/modules/user-accounts/domain/userEntity';
import { UserSqlEntity } from 'src/modules/user-accounts/domain/user-sql.entity';

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
}
