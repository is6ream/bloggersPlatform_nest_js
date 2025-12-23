import { UserViewDto } from '../user.view-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';

export class UserPaginatedViewDto extends PaginatedViewDto<UserViewDto> {
  items: UserViewDto[];
}
