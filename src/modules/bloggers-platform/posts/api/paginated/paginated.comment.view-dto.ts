import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { CommentViewDto } from 'src/modules/bloggers-platform/comments/dto/commentViewDto';

export class CommentPaginatedViewDto extends PaginatedViewDto<CommentViewDto> {
  items: CommentViewDto[];
}
