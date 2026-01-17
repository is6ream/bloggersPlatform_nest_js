import { PostRepository } from './../../../posts/infrastructure/postRepository';
import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import {
  Blog,
  BlogDocument,
  BlogModelType,
} from 'src/modules/bloggers-platform/blogs/domain/blogEntity';
import {
  PostEntity,
  PostDocument,
  PostModelType,
} from 'src/modules/bloggers-platform/posts/domain/postEntity';
import { BlogsRepository } from 'src/modules/bloggers-platform/blogs/infrastructure/blogsRepository';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { CreatePostInputDto } from 'src/modules/bloggers-platform/posts/dto/input/createPostInputDto';
import { CreatePostByBlogIdInputDto } from 'src/modules/bloggers-platform/posts/dto/input/createPostByBlogIdInputDto';

@Injectable()
export class CreateBlogByBlogIdCommand {
  constructor(
    public postId: string,
    public dto: CreatePostByBlogIdInputDto,
  ) {}
}

@CommandHandler(CreateBlogByBlogIdCommand)
export class CreateBlogByBlogIdUseCase implements ICommandHandler<CreateBlogByBlogIdCommand> {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
    @InjectModel(PostEntity.name)
    private PostModel: PostModelType,
    private postRepository: PostRepository,
    private blogRepository: BlogsRepository,
  ) {}

  async execute(command: CreateBlogByBlogIdCommand): Promise<any> {
    const blog: BlogDocument = await this.blogRepository.findOrNotFoundFail(
      command.postId,
    );
    if (!blog) {
      throw new DomainException({ code: 1, message: 'Blog not found' });
    }
    const post: PostDocument = new this.PostModel({
      title: command.dto.title,
      shortDescription: command.dto.shortDescription,
      content: command.dto.content,
      blogId: blog._id,
      blogName: blog.name,
    });
    await this.postRepository.save(post);
    return post;
  }
}
