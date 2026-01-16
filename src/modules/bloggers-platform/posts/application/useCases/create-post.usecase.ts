import { PostRepository } from './../../infrastructure/postRepository';
import { Injectable } from '@nestjs/common';
import { CreatePostInputDto } from '../../dto/input/createPostInputDto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../../domain/postEntity';
import { BlogsRepository } from 'src/modules/bloggers-platform/blogs/infrastructure/blogsRepository';
import { BlogDocument } from 'src/modules/bloggers-platform/blogs/domain/blogEntity';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { CreatePostDomainDto } from '../types/create-post-domain.dto';

@Injectable()
export class CreatePostCommand {
  constructor(public dto: CreatePostInputDto) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase implements ICommandHandler<CreatePostCommand> {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    private postRepository: PostRepository,
    private blogsRepository: BlogsRepository,
  ) {}

  async execute(command: CreatePostCommand): Promise<string> {
    const blog: BlogDocument =
      await this.blogsRepository.findByIdOrThrowValidationError(
        command.dto.blogId,
      );

    const createPostDto: CreatePostDomainDto = {
      title: command.dto.title,
      shortDescription: command.dto.shortDescription,
      content: command.dto.content,
      blogId: command.dto.blogId,
      blogName: blog.name,
    };

    console.log(createPostDto, 'createPostDto check');
    const post: PostDocument = this.PostModel.createInstance(createPostDto);
    console.log(post, 'post check');
    await this.postRepository.save(post);
    return post._id.toString();
  }
}
