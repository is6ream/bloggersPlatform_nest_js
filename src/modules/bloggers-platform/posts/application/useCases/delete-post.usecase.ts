import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure/postRepository';

@Injectable()
export class DeletePostCommand {
  constructor(public id: string) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase implements ICommandHandler<DeletePostCommand> {
  constructor(private postRepository: PostRepository) {}

  async execute(command: DeletePostCommand): Promise<void> {
    const post = await this.postRepository.findOrNotFoundFail(command.id);
    post.makeDeleted();
    await this.postRepository.save(post);
  }
}
