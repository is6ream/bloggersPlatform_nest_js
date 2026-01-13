import { Injectable } from '@nestjs/common';
import { UpdatePostInputDto } from '../../dto/input/updatePostInputDto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure/postRepository';
import { BlogsRepository } from 'src/modules/bloggers-platform/blogs/infrastructure/blogsRepository';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../../domain/postEntity';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
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
    @InjectModel(Post.name)
    private postRepository: PostRepository,
  ) {}

  async execute(command: UpdatePostCommand): Promise<any> {
    const post: PostDocument = await this.postRepository.findOrNotFoundFail(
      command.id,
    );
    if (!post) {
      throw new DomainException({ code: 1, message: 'Post not found' });
    }
    post.updatePost(command.dto);
    await this.postRepository.save(post);
  }
}
