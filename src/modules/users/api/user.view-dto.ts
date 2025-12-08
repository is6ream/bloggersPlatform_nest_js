import { UserDocument } from '../domain/userEntity';

export class UserViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: Date;
  totalCount: number;

  static mapToView(user: UserDocument): UserViewDto {
    const dto = new UserViewDto();

    dto.email = user.email;
    dto.login = user.login;
    dto.id = user._id.toString();
    dto.createdAt = user.createdAt;

    return dto;
  }
}
