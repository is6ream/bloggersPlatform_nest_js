import { UserOrmEntity } from 'src/modules/user-accounts/infrastructure/users/entities/user.orm-entity';

export class UserViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: Date;

  static fromOrm(user: UserOrmEntity): UserViewDto {
    const dto = new UserViewDto();
    dto.id = user.id;
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt;
    return dto;
  }
}
