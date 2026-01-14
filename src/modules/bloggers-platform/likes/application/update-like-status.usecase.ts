import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../posts/infrastructure/postRepository';
import { BlogsRepository } from '../../blogs/infrastructure/blogsRepository';
import { UsersRepository } from 'src/modules/user-accounts/infrastructure/users/usersRepository';
@Injectable()
export class UpdateLikeStatusCommand {
    constructor(
        public postId: string,
        public userId: string,
        public likeStatus: string,
    ) {}
}


@CommandHandler(UpdateLikeStatusCommand)
export class UpdateLikeStatusUseCase implements ICommandHandler {
    constructor(
        private postRepository: PostRepository,
        private blogsRepository: BlogsRepository,
        private usersRepository: UsersRepository
    ) {}

    async execute(command: UpdateLikeStatusCommand): Promise<any> {
        const post = await this.postRepository.findOrNotFoundFail(command.postId);
        const blog = await this.blogsRepository.findByIdOrThrowValidationError(post.blogId);
        const user = await this.usersRepository.findOrNotFoundFail(command.userId);
    }
}   