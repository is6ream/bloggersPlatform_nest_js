import { CreatePostUseCase } from './useCases/create-post.usecase';
import { DeletePostUseCase } from './useCases/delete-post.usecase';
import { UpdatePostUseCase } from './useCases/update-post.usecase';

export const postCommandHandlers = [UpdatePostUseCase, CreatePostUseCase, DeletePostUseCase];
