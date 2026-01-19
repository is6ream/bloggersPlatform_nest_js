export class CommentViewModel {
  id: string;
  content: string;
  commentatorInfo: { userId: string; userLogin: string };
  createdAt: Date;
  likesInfo: { likesCount: number; dislikesCount: number; myStatus: string };

  constructor() {
    this.commentatorInfo = { userId: '', userLogin: '' };
    this.likesInfo = { likesCount: 0, dislikesCount: 0, myStatus: 'None' };
  }
}
