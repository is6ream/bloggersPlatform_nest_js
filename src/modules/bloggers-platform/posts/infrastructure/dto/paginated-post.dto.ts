import { PostViewDto} from 'src/modules/bloggers-platform/posts/infrastructure/dto/post-view.dto';

export class PaginatedPostsDto {
  constructor(
    public pagesCount: number,
    public page: number,
    public pageSize: number,
    public totalCount: number,
    public items: PostViewDto[],
  ) {}
}
