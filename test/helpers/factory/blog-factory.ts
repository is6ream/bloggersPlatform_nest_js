import { BlogModelType } from 'src/modules/bloggers-platform/blogs/domain/blogEntity';

export async function createTestBlog(
  blogModel: BlogModelType,
  overrides: Partial<{
    name: string;
    description: string;
    websiteUrl: string;
    isMembership: boolean;
    deleteAt: Date | null;
  }> = {},
) {
  const defaultData = {
    name: 'Test Blog',
    description: 'This is a test blog description',
    websiteUrl: 'https://test-blog.example.com',
    isMembership: true,
    deleteAt: null,
  };

  const blogData = { ...defaultData, ...overrides };
  return blogModel.create(blogData);
}

// Специализированные методы
export async function createTestBlogWithCustomName(
  blogModel: BlogModelType,
  name: string,
  overrides: Partial<any> = {},
) {
  return createTestBlog(blogModel, { name, ...overrides });
}

export async function createTestBlogForPosts(
  blogModel: BlogModelType,
  overrides: Partial<any> = {},
) {
  return createTestBlog(blogModel, {
    name: 'Posts Testing Blog',
    description: 'Blog specifically for testing posts functionality',
    ...overrides,
  });
}
