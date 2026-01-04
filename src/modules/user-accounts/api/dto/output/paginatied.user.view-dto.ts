import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { UserViewDto } from './user.view-dto';

export class UserPaginatedViewDto extends PaginatedViewDto<UserViewDto> {
  items: UserViewDto[];
}
