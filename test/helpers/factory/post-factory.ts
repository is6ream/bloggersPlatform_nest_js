import { PostModelType } from 'src/modules/bloggers-platform/posts/domain/postEntity';

export async function createTestPost(
  postModel: PostModelType,
  blogId: string,
  blogName: string,
  overrides: Partial<{
    title: string;
    shortDescription: string;
    content: string;
    deleteAt: Date | null;
    likesInfo: {
      likesCount: number;
      dislikesCount: number;
      myStatus: 'None' | 'Like' | 'Dislike';
    };
  }> = {},
) {
  const defaultData = {
    title: 'Test Post Title',
    shortDescription: 'This is a test short description for the post',
    content:
      'This is the main content of the test post. It should be long enough for testing purposes.',
    blogId,
    blogName,
    deleteAt: null,
    likesInfo: {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: 'None' as const,
    },
    createdAt: new Date(),
  };

  const mergedData = { ...defaultData, ...overrides };

  return postModel.create(mergedData);
}
