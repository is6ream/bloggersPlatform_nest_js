import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BlogsRawSqlQueryRepository } from '../../infrastructure/blogs-raw-sql.query-repository';

export class GetBlogByIdQuery {
  constructor(public blogId: string) {}
}

@QueryHandler(GetBlogByIdQuery)
export class GetBlogByIdQueryHandler implements IQueryHandler<GetBlogByIdQuery> {
  constructor(private blogsQueryRepository: BlogsRawSqlQueryRepository) {}

  async execute(query: GetBlogByIdQuery): Promise<any> {
    return this.blogsQueryRepository.getByIdOrNotFoundFail(query.blogId);
  }
}
