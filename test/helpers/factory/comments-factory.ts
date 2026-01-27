
import { CommentModelType } from 'src/modules/bloggers-platform/comments/domain/commentEntity';

export async function createTestCommentForLikes(
  commentModel: CommentModelType,
  postId: string,
  userId: string,
  userLogin: string,
  overrides: Partial<{
    content: string;
  }> = {},
) {
  const defaultData = {
    content: 'Test comment for like operations',
    commentatorInfo: {
      userId,
      userLogin,
    },
    likesInfo: {
      likesCount: 0,
      dislikesCount: 0,
      status: 'None' as const,
    },
  };

  const commentData = { ...defaultData, ...overrides };
  return commentModel.create(commentData);
}
