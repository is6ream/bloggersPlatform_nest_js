import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BlogsQueryRepository } from '../../infrastructure/blogsQueryRepository';

export class GetBlogByIdQuery {
  constructor(public blogId: string) {}
}

@QueryHandler(GetBlogByIdQuery)
export class GetBlogByIdQueryHandler implements IQueryHandler<GetBlogByIdQuery> {
  constructor(private blogsQueryRepository: BlogsQueryRepository) {}

  async execute(query: GetBlogByIdQuery): Promise<any> {
    return this.blogsQueryRepository.getByIdOrNotFoundFail(query.blogId);
  }
}
