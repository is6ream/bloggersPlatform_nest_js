import { PostRepository } from './../../../posts/infrastructure/postRepository';
import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import {
  PostEntity,
  PostDocument,
  PostModelType,
} from 'src/modules/bloggers-platform/posts/domain/postEntity';
import { BlogsRepository } from 'src/modules/bloggers-platform/blogs/infrastructure/blogsRepository';
import { CreatePostByBlogIdInputDto } from 'src/modules/bloggers-platform/posts/dto/input/createPostByBlogIdInputDto';

@Injectable()
export class CreatePostForSpecificBlogCommand {
  constructor(
    public postId: string,
    public dto: CreatePostByBlogIdInputDto,
  ) {}
}

@CommandHandler(CreatePostForSpecificBlogCommand)
export class CreatePostByBlogIdUseCase implements ICommandHandler<CreatePostForSpecificBlogCommand> {
  constructor(
    @InjectModel(PostEntity.name)
    private PostModel: PostModelType,
    private postRepository: PostRepository,
    private blogRepository: BlogsRepository,
  ) {}

  async execute(command: CreatePostForSpecificBlogCommand): Promise<any> {
    const blog = await this.blogRepository.findOrNotFoundFail(command.postId);
    const post: PostDocument = this.PostModel.createInstance({
      title: command.dto.title,
      shortDescription: command.dto.shortDescription,
      content: command.dto.content,
      blogId: blog.id,
      blogName: blog.name,
    });
    await this.postRepository.save(post);
    return post;
  }
}
