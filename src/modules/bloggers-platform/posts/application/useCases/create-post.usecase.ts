import { PostRepository } from './../../infrastructure/postRepository';
import { Injectable } from '@nestjs/common';
import { CreatePostInputDto } from '../../dto/input/createPostInputDto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { PostEntity, PostModelType } from '../../domain/postEntity';
import { BlogsRepository } from 'src/modules/bloggers-platform/blogs/infrastructure/blogsRepository';

@Injectable()
export class CreatePostCommand {
  constructor(public dto: CreatePostInputDto) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase implements ICommandHandler<CreatePostCommand> {
  constructor(
    @InjectModel(PostEntity.name)
    private PostModel: PostModelType,
    private blogsRepository: BlogsRepository,
    private postRepository: PostRepository,
  ) {}

  async execute(command: CreatePostCommand): Promise<string> {
    const blog = await this.blogsRepository.findByIdOrThrowValidationError(
      command.dto.blogId,
    );
    const createData = {
      title: command.dto.title,
      shortDescription: command.dto.shortDescription,
      content: command.dto.content,
      blogId: command.dto.blogId,
      blogName: blog.name,
    };

    const post1 = this.PostModel.createInstance(createData);
    post1.title = createData.title;
    await this.postRepository.save(post1);
    return post1._id.toString();
  }
}
