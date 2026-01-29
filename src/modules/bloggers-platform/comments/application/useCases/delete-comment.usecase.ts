import { Injectable } from '@nestjs/common';

@Injectable()
export class DeleteCommentCommand {
  constructor(public commentId: string) {}
}


