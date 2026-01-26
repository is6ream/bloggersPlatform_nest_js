import { BlogModelType } from 'src/modules/bloggers-platform/blogs/domain/blogEntity';

export async function createTestBlogs(
  blogModel: BlogModelType,
  count: number,
  baseOverrides: Partial<{
    name: string;
    description: string;
    websiteUrl: string;
    isMembership: boolean;
    deleteAt: Date | null;
  }> = {},
) {
  const blogs = [];

  for (let i = 0; i < count; i++) {
    const blogData = {
      name: baseOverrides.name || `Test Blog ${i + 1}`,
      description: baseOverrides.description || `Description for blog ${i + 1}`,
      websiteUrl:
        baseOverrides.websiteUrl || `https://blog-${i + 1}.example.com`,
      isMembership:
        baseOverrides.isMembership !== undefined
          ? baseOverrides.isMembership
          : true,
      deleteAt: baseOverrides.deleteAt || null,
    };

    const blog = await blogModel.create(blogData);
    blogs.push(blog);
  }

  return blogs;
}
