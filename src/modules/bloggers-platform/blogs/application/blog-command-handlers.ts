import { CreateBlogUseCase } from './useCases/create-blog.usecase';
import { UpdateBlogUseCase } from './useCases/update-blog-usecase';
import { DeleteBlogByIdUseCase } from './useCases/delete-blog-by-id.usecase';
import { GetBlogByIdQueryHandler } from './queries/get-blog-byId.query';
import { CreatePostByBlogIdUseCase } from './useCases/create-blog-by-blogId.usecase';
import { UpdatePostForSpecificBlogUseCase } from './useCases/update-post-for-specific-blog.usecase';

export const blogCommandHandlers = [
  CreateBlogUseCase,
  CreatePostByBlogIdUseCase,
  UpdatePostForSpecificBlogUseCase,
  UpdateBlogUseCase,
  DeleteBlogByIdUseCase,
  GetBlogByIdQueryHandler,
];
