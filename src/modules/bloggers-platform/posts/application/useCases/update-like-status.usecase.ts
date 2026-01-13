import { Injectable } from '@nestjs/common';

@Injectable()
export class UpdateLikeStatusCommand {
    constructor(
        public postId: string,
        public userId: string,
        public likeStatus: string,
    ) {}
}
