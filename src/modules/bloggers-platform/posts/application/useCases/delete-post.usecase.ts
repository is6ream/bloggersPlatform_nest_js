import { Injectable } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InjectModel } from "@nestjs/mongoose";
import { DomainException } from "src/core/exceptions/domain-exceptions";
import { PostEntity } from "../../domain/postEntity";
import { PostRepository } from "../../infrastructure/postRepository";
import { PostDocument } from "../../domain/postEntity";
import { PostModelType } from "../../domain/postEntity";
@Injectable()
export class DeletePostCommand {
    constructor(
        public id: string,
    ) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase implements ICommandHandler<DeletePostCommand> {
    constructor(
        @InjectModel(PostEntity.name)
        private PostModel: PostModelType,
        private postRepository: PostRepository
    ) {}

    async execute(command: DeletePostCommand): Promise<any> {
        const post: PostDocument = await this.postRepository.findOrNotFoundFail(command.id);
        if (!post) {
            throw new DomainException({ code: 1, message: 'Post not found' });
        }
        post.makeDeleted();
        await this.postRepository.save(post);
    }
}
