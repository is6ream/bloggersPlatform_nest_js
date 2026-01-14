import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

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
        //todo need to inject all necessary dependencies
    ) {}
}