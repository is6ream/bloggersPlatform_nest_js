import { CreateBlogUseCase } from './useCases/create-blog.usecase';
import { CreateBlogByBlogIdUseCase } from './useCases/create-blog-by-blogId.usecase';
import { UpdateBlogUseCase } from './useCases/update-blog-usecase';
import { DeleteBlogByIdUseCase } from './useCases/delete-blog-by-id.usecase';
import { GetBlogByIdQueryHandler } from './queries/get-blog-byId.query';
export const blogCommandHandlers = [
  CreateBlogUseCase,
  CreateBlogByBlogIdUseCase,
  UpdateBlogUseCase,
  DeleteBlogByIdUseCase,
  GetBlogByIdQueryHandler,
];
