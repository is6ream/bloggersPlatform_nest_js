import { Injectable } from '@nestjs/common';
import { UpdatePostInputDto } from '../../dto/input/updatePostInputDto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure/postRepository';
import { BlogsRepository } from 'src/modules/bloggers-platform/blogs/infrastructure/blogsRepository';
import { PostDocument } from '../../domain/postEntity';
@Injectable()
export class UpdatePostCommand {
  constructor(
    public id: string,
    public dto: UpdatePostInputDto,
  ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<UpdatePostCommand> {
  constructor(
    private postRepository: PostRepository,
    private blogsRepository: BlogsRepository,
  ) {}

  async execute(command: UpdatePostCommand): Promise<any> {
    const post: PostDocument = await this.postRepository.findOrNotFoundFail(
      command.id,
    );
    await this.blogsRepository.findByIdOrThrowValidationError(
      command.dto.blogId,
    );
    post.updatePost(command.dto);
    await this.postRepository.save(post);
  }
}
