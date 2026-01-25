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
  };

  const postData = { ...defaultData, ...overrides };

  // Если у модели есть статический метод createInstance
  if (postModel.createInstance) {
    return postModel.createInstance({
      title: postData.title,
      shortDescription: postData.shortDescription,
      content: postData.content,
      blogId: postData.blogId,
      blogName: postData.blogName,
    });
  }

  return postModel.create(postData);
}

// Специализированные методы для постов
export async function createTestPostWithLongTitle(
  postModel: PostModelType,
  blogId: string,
  blogName: string,
  overrides: Partial<any> = {},
) {
  return createTestPost(postModel, blogId, blogName, {
    title: 'A'.repeat(100), // Для тестирования валидации максимальной длины
    ...overrides,
  });
}

export async function createTestPostWithShortContent(
  postModel: PostModelType,
  blogId: string,
  blogName: string,
  overrides: Partial<any> = {},
) {
  return createTestPost(postModel, blogId, blogName, {
    content: 'Short', // Для тестирования валидации минимальной длины
    ...overrides,
  });
}

export async function createTestPostForComments(
  postModel: PostModelType,
  blogId: string,
  blogName: string,
  overrides: Partial<any> = {},
) {
  return createTestPost(postModel, blogId, blogName, {
    title: 'Post for Comments Testing',
    content:
      'This post is specifically created for testing comments functionality.',
    ...overrides,
  });
}
